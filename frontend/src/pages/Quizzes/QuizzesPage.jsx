import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../Auth/AuthContext.jsx";
import QuizCreatePanel from "./components/QuizCreatePanel.jsx";
import QuizGrid from "./components/QuizGrid.jsx";
import QuizHeader from "./components/QuizHeader.jsx";
import QuizHistory from "./components/QuizHistory.jsx";
import QuizTakePanel from "./components/QuizTakePanel.jsx";
import { createEmptyQuestion, normalizeQuizQuestions } from "./quizUtils.js";
import "./QuizzesPage.css";

function QuizzesPage() {
  const { user, restoring } = useAuth();
  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizError, setQuizError] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    isPublic: true,
    assignedStudentIds: [],
    showCorrectAnswers: false,
    questions: [createEmptyQuestion()],
  });
  const [students, setStudents] = useState([]);

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsError, setSubmissionsError] = useState(null);
  const [submissionPage, setSubmissionPage] = useState(0);

  const loadQuizzes = useCallback(async () => {
    if (restoring) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (!window.api?.getAllQuizzes) {
        setError("Quiz API not available. Please run inside Electron.");
        setLoading(false);
        return;
      }
      const result = await window.api.getAllQuizzes();
      if (result.success) {
        setQuizzes(result.quizzes || []);
      } else {
        setError(result.error || "Failed to load quizzes.");
      }
    } catch (err) {
      setError(err.message || "Unable to load quizzes.");
    } finally {
      setLoading(false);
    }
  }, [restoring]);

  useEffect(() => {
    if (!restoring) {
      loadQuizzes();
    }
  }, [loadQuizzes, restoring]);

  const loadStudents = useCallback(async () => {
    if (!isInstructor || !window.api?.getAllUsers) {
      return;
    }
    if (restoring) {
      return;
    }
    try {
      const result = await window.api.getAllUsers();
      if (result.success) {
        setStudents((result.users || []).filter((userItem) => userItem.role === "student"));
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    }
  }, [isInstructor, restoring]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const loadSubmissions = useCallback(async () => {
    if (!window.api?.getUserQuizSubmissions || !user?.id) {
      return;
    }
    if (restoring) {
      return;
    }
    try {
      setSubmissionsError(null);
      const result = await window.api.getUserQuizSubmissions();
      if (result.success) {
        setSubmissions(result.submissions || []);
        setSubmissionPage(0);
      } else {
        setSubmissionsError(result.error || "Unable to load quiz history.");
      }
    } catch (err) {
      setSubmissionsError(err.message || "Unable to load quiz history.");
    }
  }, [user, restoring]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    setSubmissions([]);
    if (user?.id) {
      loadSubmissions();
    }
  }, [user?.id, loadSubmissions]);

  const handleSelectQuiz = async (quizId) => {
    setSelectedQuiz(null);
    setQuizError(null);
    setAnswers({});
    setSubmitResult(null);

    try {
      const response = await window.api.getQuiz(quizId);
      if (response.success) {
        setSelectedQuiz(response.quiz);
      } else {
        setQuizError(response.error || "Unable to load quiz.");
      }
    } catch (err) {
      setQuizError(err.message || "Unable to load quiz.");
    }
  };

  const handleAnswerChange = (questionId, selectedAnswerIndex) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: selectedAnswerIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz || !user?.id) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);

    try {
      const payload = {
        quizId: selectedQuiz.id,
        answers: selectedQuiz.questions.map((question) => ({
          questionId: question.id,
          selectedAnswerIndex: answers[question.id] ?? null,
        })),
      };
      const response = await window.api.submitQuiz(payload);
      if (response.success) {
        setSubmitResult(response.result);
        loadSubmissions();
        setSubmissionPage(0);
      } else {
        setSubmitError(response.error || "Unable to submit quiz.");
      }
    } catch (err) {
      setSubmitError(err.message || "Unable to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmitQuiz = useMemo(() => {
    if (!selectedQuiz) {
      return false;
    }
    return selectedQuiz.questions.every((question) =>
      Number.isInteger(answers[question.id])
    );
  }, [answers, selectedQuiz]);

  const handleToggleCreate = () => {
    setShowCreate((previous) => !previous);
    setCreateError(null);
    setCreateSuccess(null);
    setActionMessage(null);
    setActionError(null);
    if (showCreate) {
      setEditingQuizId(null);
      setNewQuiz({
        title: "",
        description: "",
        isPublic: true,
        assignedStudentIds: [],
        showCorrectAnswers: false,
        questions: [createEmptyQuestion()],
      });
    }
  };

  const handleCreateQuiz = async (event) => {
    event.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setActionMessage(null);
    setActionError(null);

    const title = newQuiz.title.trim();
    if (!title) {
      setCreateError("Quiz title is required.");
      return;
    }

    const normalizedQuestions = normalizeQuizQuestions(newQuiz.questions);

    if (normalizedQuestions.some((question) => !question.prompt)) {
      setCreateError("Each question needs a prompt.");
      return;
    }

    if (
      normalizedQuestions.some(
        (question) =>
          question.type === "multiple_choice" && question.options.length < 2
      )
    ) {
      setCreateError("Multiple choice questions need at least two options.");
      return;
    }

    if (
      normalizedQuestions.some(
        (question) =>
          question.type === "multiple_choice" &&
          question.options.some((option) => option.length === 0)
      )
    ) {
      setCreateError("Multiple choice options cannot be blank.");
      return;
    }

    if (!newQuiz.isPublic && newQuiz.assignedStudentIds.length === 0) {
      setCreateError("Select at least one student or set the quiz to public.");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title,
        description: newQuiz.description.trim(),
        questions: normalizedQuestions,
        isPublic: newQuiz.isPublic,
        assignedStudentIds: newQuiz.assignedStudentIds,
        showCorrectAnswers: newQuiz.showCorrectAnswers,
      };
      const response = editingQuizId
        ? await window.api.updateQuiz({ quizId: editingQuizId, updates: payload })
        : await window.api.createQuiz(payload);
      if (response.success) {
        setCreateSuccess(
          editingQuizId ? "Quiz updated successfully." : "Quiz created successfully."
        );
        setEditingQuizId(null);
        setShowCreate(false);
        setNewQuiz({
          title: "",
          description: "",
          isPublic: true,
          assignedStudentIds: [],
          showCorrectAnswers: false,
          questions: [createEmptyQuestion()],
        });
        await loadQuizzes();
        await loadStudents();
      } else {
        setCreateError(response.error || "Unable to create quiz.");
      }
    } catch (err) {
      setCreateError(err.message || "Unable to create quiz.");
    } finally {
      setCreating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuizId(null);
    setCreateError(null);
    setCreateSuccess(null);
    setNewQuiz({
      title: "",
      description: "",
      isPublic: true,
      assignedStudentIds: [],
      showCorrectAnswers: false,
      questions: [createEmptyQuestion()],
    });
  };

  const handleEditQuiz = async (quizId) => {
    setActionMessage(null);
    setActionError(null);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const response = await window.api.getQuiz(quizId);
      if (!response.success) {
        setActionError(response.error || "Unable to load quiz.");
        return;
      }
      const quiz = response.quiz;
      setEditingQuizId(quizId);
      setShowCreate(true);
      setNewQuiz({
        title: quiz.title ?? "",
        description: quiz.description ?? "",
        isPublic: Boolean(quiz.isPublic),
        assignedStudentIds: quiz.assignedStudentIds || [],
        showCorrectAnswers: Boolean(quiz.showCorrectAnswers),
        questions: (quiz.questions || []).map((question) => ({
          tempId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          prompt: question.prompt ?? "",
          type: question.type ?? "multiple_choice",
          options: question.options || ["", ""],
          correctAnswerIndex: question.correctAnswerIndex ?? 0,
          explanation: question.explanation ?? "",
        })),
      });
    } catch (err) {
      setActionError(err.message || "Unable to load quiz.");
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    setActionMessage(null);
    setActionError(null);
    if (!window.confirm("Delete this quiz? This cannot be undone.")) {
      return;
    }
    try {
      const response = await window.api.deleteQuiz(quizId);
      if (response.success) {
        setActionMessage("Quiz deleted.");
        if (selectedQuiz?.id === quizId) {
          setSelectedQuiz(null);
        }
        await loadQuizzes();
        setSubmissionPage(0);
      } else {
        setActionError(response.error || "Unable to delete quiz.");
      }
    } catch (err) {
      setActionError(err.message || "Unable to delete quiz.");
    }
  };

  const handleCopyQuiz = async (quizId) => {
    setActionMessage(null);
    setActionError(null);
    try {
      const response = await window.api.copyQuiz(quizId);
      if (response.success) {
        setActionMessage("Quiz copied.");
        await loadQuizzes();
        setSubmissionPage(0);
      } else {
        setActionError(response.error || "Unable to copy quiz.");
      }
    } catch (err) {
      setActionError(err.message || "Unable to copy quiz.");
    }
  };

  const handleExportQuiz = async (quizId) => {
    setActionMessage(null);
    setActionError(null);
    if (!window.api?.showSaveDialog || !window.api?.exportQuiz) {
      setActionError("Quiz export is only available in the desktop app.");
      return;
    }
    try {
      const dialogResult = await window.api.showSaveDialog({
        title: "Export Quiz",
        defaultPath: "quiz.json",
        filters: [{ name: "Quiz JSON", extensions: ["json"] }],
      });
      if (dialogResult.canceled || !dialogResult.filePath) {
        return;
      }
      const response = await window.api.exportQuiz({
        quizId,
        filePath: dialogResult.filePath,
      });
      if (response.success) {
        setActionMessage("Quiz exported.");
      } else {
        setActionError(response.error || "Unable to export quiz.");
      }
    } catch (err) {
      setActionError(err.message || "Unable to export quiz.");
    }
  };

  const handleImportQuiz = async () => {
    setActionMessage(null);
    setActionError(null);
    if (!window.api?.showOpenDialog || !window.api?.importQuiz) {
      setActionError("Quiz import is only available in the desktop app.");
      return;
    }
    try {
      const dialogResult = await window.api.showOpenDialog({
        title: "Import Quiz",
        properties: ["openFile"],
        filters: [{ name: "Quiz JSON", extensions: ["json"] }],
      });
      if (dialogResult.canceled || dialogResult.filePaths?.length === 0) {
        return;
      }
      const filePath = dialogResult.filePaths[0];
      const response = await window.api.importQuiz({ filePath });
      if (response.success) {
        setActionMessage("Quiz imported.");
        await loadQuizzes();
        setSubmissionPage(0);
      } else {
        setActionError(response.error || "Unable to import quiz.");
      }
    } catch (err) {
      setActionError(err.message || "Unable to import quiz.");
    }
  };

  const updateQuestion = (tempId, updates) => {
    setNewQuiz((previous) => ({
      ...previous,
      questions: previous.questions.map((question) =>
        question.tempId === tempId ? { ...question, ...updates } : question
      ),
    }));
  };

  const handleQuestionTypeChange = (tempId, type) => {
    if (type === "true_false") {
      updateQuestion(tempId, {
        type,
        options: ["True", "False"],
        correctAnswerIndex: 0,
      });
      return;
    }

    updateQuestion(tempId, {
      type: "multiple_choice",
      options: ["", ""],
      correctAnswerIndex: 0,
    });
  };

  const addQuestion = () => {
    setNewQuiz((previous) => ({
      ...previous,
      questions: [...previous.questions, createEmptyQuestion()],
    }));
  };

  const removeQuestion = (tempId) => {
    setNewQuiz((previous) => ({
      ...previous,
      questions: previous.questions.filter(
        (question) => question.tempId !== tempId
      ),
    }));
  };

  const addOption = (tempId) => {
    setNewQuiz((previous) => ({
      ...previous,
      questions: previous.questions.map((question) => {
        if (question.tempId !== tempId) {
          return question;
        }
        return {
          ...question,
          options: [...question.options, ""],
        };
      }),
    }));
  };

  const updateOption = (tempId, optionIndex, value) => {
    setNewQuiz((previous) => ({
      ...previous,
      questions: previous.questions.map((question) => {
        if (question.tempId !== tempId) {
          return question;
        }
        const nextOptions = [...question.options];
        nextOptions[optionIndex] = value;
        return {
          ...question,
          options: nextOptions,
        };
      }),
    }));
  };

  const removeOption = (tempId, optionIndex) => {
    setNewQuiz((previous) => ({
      ...previous,
      questions: previous.questions.map((question) => {
        if (question.tempId !== tempId) {
          return question;
        }
        const nextOptions = question.options.filter(
          (_, index) => index !== optionIndex
        );
        const nextCorrectIndex = Math.min(
          question.correctAnswerIndex,
          nextOptions.length - 1
        );
        return {
          ...question,
          options: nextOptions,
          correctAnswerIndex: Math.max(nextCorrectIndex, 0),
        };
      }),
    }));
  };

  if (loading || restoring) {
    return (
      <div className="page-container">
        <div className="quizzes-loading">Loading quizzes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="quizzes-error">
          <p>{error}</p>
          <button type="button" onClick={loadQuizzes}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <QuizHeader
        isInstructor={isInstructor}
        showCreate={showCreate}
        onToggleCreate={handleToggleCreate}
        onImportQuiz={handleImportQuiz}
      />

      {isInstructor && showCreate && (
        <QuizCreatePanel
          newQuiz={newQuiz}
          setNewQuiz={setNewQuiz}
          isEditing={Boolean(editingQuizId)}
          creating={creating}
          createError={createError}
          createSuccess={createSuccess}
          onSubmit={handleCreateQuiz}
          onCancelEdit={handleCancelEdit}
          addQuestion={addQuestion}
          removeQuestion={removeQuestion}
          updateQuestion={updateQuestion}
          handleQuestionTypeChange={handleQuestionTypeChange}
          addOption={addOption}
          updateOption={updateOption}
          removeOption={removeOption}
          students={students}
        />
      )}

      {actionError && <p className="quiz-error">{actionError}</p>}
      {actionMessage && <p className="quiz-success">{actionMessage}</p>}

      <QuizGrid
        quizzes={quizzes}
        onSelectQuiz={handleSelectQuiz}
        isInstructor={isInstructor}
        onEditQuiz={handleEditQuiz}
        onDeleteQuiz={handleDeleteQuiz}
        onCopyQuiz={handleCopyQuiz}
        onExportQuiz={handleExportQuiz}
      />

      {quizError && <p className="quiz-error">{quizError}</p>}

      <QuizTakePanel
        quiz={selectedQuiz}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        onSubmit={handleSubmitQuiz}
        canSubmit={canSubmitQuiz}
        submitting={submitting}
        submitError={submitError}
        submitResult={submitResult}
        onClose={() => setSelectedQuiz(null)}
      />

      <QuizHistory submissions={submissions} />
    </div>
  );
}

export default QuizzesPage;
