import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../Auth/AuthContext.jsx";
import QuizCreatePanel from "./components/QuizCreatePanel.jsx";
import QuizGrid from "./components/QuizGrid.jsx";
import QuizHeader from "./components/QuizHeader.jsx";
import QuizTakePanel from "./components/QuizTakePanel.jsx";
import { createEmptyQuestion, normalizeQuizQuestions } from "./quizUtils.js";
import "./QuizzesPage.css";

function QuizzesPage() {
  const { user } = useAuth();
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
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    questions: [createEmptyQuestion()],
  });

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const loadQuizzes = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

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
        userId: user.id,
        answers: selectedQuiz.questions.map((question) => ({
          questionId: question.id,
          selectedAnswerIndex: answers[question.id] ?? null,
        })),
      };
      const response = await window.api.submitQuiz(payload);
      if (response.success) {
        setSubmitResult(response.result);
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
  };

  const handleCreateQuiz = async (event) => {
    event.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

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

    setCreating(true);
    try {
      const response = await window.api.createQuiz({
        title,
        description: newQuiz.description.trim(),
        createdBy: user?.id,
        questions: normalizedQuestions,
      });
      if (response.success) {
        setCreateSuccess("Quiz created successfully.");
        setNewQuiz({
          title: "",
          description: "",
          questions: [createEmptyQuestion()],
        });
        await loadQuizzes();
      } else {
        setCreateError(response.error || "Unable to create quiz.");
      }
    } catch (err) {
      setCreateError(err.message || "Unable to create quiz.");
    } finally {
      setCreating(false);
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

  if (loading) {
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
      />

      {isInstructor && showCreate && (
        <QuizCreatePanel
          newQuiz={newQuiz}
          setNewQuiz={setNewQuiz}
          creating={creating}
          createError={createError}
          createSuccess={createSuccess}
          onSubmit={handleCreateQuiz}
          addQuestion={addQuestion}
          removeQuestion={removeQuestion}
          updateQuestion={updateQuestion}
          handleQuestionTypeChange={handleQuestionTypeChange}
          addOption={addOption}
          updateOption={updateOption}
          removeOption={removeOption}
        />
      )}

      <QuizGrid quizzes={quizzes} onSelectQuiz={handleSelectQuiz} />

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
    </div>
  );
}

export default QuizzesPage;
