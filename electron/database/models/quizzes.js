import { getDb } from "../database.js";
import { getRoleById } from "./users.js";

const VALID_TYPES = new Set(["true_false", "multiple_choice"]);

const normalizeQuestion = (question = {}, index) => {
  const prompt = String(question.prompt ?? "").trim();
  if (!prompt) {
    throw new Error(`Question ${index + 1} is missing a prompt.`);
  }

  const type = VALID_TYPES.has(question.type)
    ? question.type
    : "multiple_choice";

  let options = Array.isArray(question.options)
    ? question.options.map((option) => String(option ?? "").trim())
    : [];

  if (type === "true_false") {
    options = ["True", "False"];
  }

  if (type === "multiple_choice" && options.length < 2) {
    throw new Error(`Question ${index + 1} must have at least two options.`);
  }

  if (type === "multiple_choice" && options.some((option) => option.length === 0)) {
    throw new Error(`Question ${index + 1} has empty options.`);
  }

  const correctAnswerIndex = Number.isInteger(question.correctAnswerIndex)
    ? question.correctAnswerIndex
    : 0;

  if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
    throw new Error(`Question ${index + 1} has an invalid correct answer.`);
  }

  return {
    prompt,
    type,
    options,
    correctAnswerIndex,
    explanation: String(question.explanation ?? "").trim() || null,
  };
};

const normalizeQuizVisibility = (value) =>
  value === false || value === 0 || value === "false" ? 0 : 1;

const normalizeShowCorrect = (value) =>
  value === true || value === 1 || value === "true" ? 1 : 0;

const normalizeAssignedStudents = (assignedStudentIds) => {
  if (!Array.isArray(assignedStudentIds)) {
    return [];
  }
  const unique = new Set();
  assignedStudentIds.forEach((id) => {
    const numericId = Number(id);
    if (Number.isInteger(numericId) && numericId > 0) {
      unique.add(numericId);
    }
  });
  return Array.from(unique);
};

const hasInstructorAccess = (role) =>
  role === "admin" || role === "instructor";

const shuffleArray = (items) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getQuizAssignments = (db, quizId) =>
  db
    .prepare("SELECT userId FROM quiz_assignments WHERE quizId = ?")
    .all(quizId)
    .map((row) => row.userId);

const canStudentAccessQuiz = (db, quizId, userId) => {
  const quiz = db
    .prepare("SELECT isPublic FROM quizzes WHERE id = ?")
    .get(quizId);
  if (!quiz) {
    return false;
  }
  if (quiz.isPublic) {
    return true;
  }
  const assignment = db
    .prepare(
      "SELECT 1 FROM quiz_assignments WHERE quizId = ? AND userId = ?"
    )
    .get(quizId, userId);
  return Boolean(assignment);
};

export function createQuiz({
  title,
  description,
  createdBy,
  questions,
  isPublic = true,
  showCorrectAnswers = false,
  assignedStudentIds = [],
} = {}) {
  const trimmedTitle = String(title ?? "").trim();
  if (!trimmedTitle) {
    throw new Error("Quiz title is required.");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Quiz must include at least one question.");
  }

  const db = getDb();
  const insertQuiz = db.prepare(
    `INSERT INTO quizzes (title, description, createdBy, isPublic, showCorrectAnswers)
     VALUES (?, ?, ?, ?, ?);`
  );
  const insertQuestion = db.prepare(
    `
    INSERT INTO quiz_questions
      (quizId, prompt, type, options, correctAnswerIndex, explanation, orderIndex)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `
  );
  const insertAssignment = db.prepare(
    `
    INSERT OR IGNORE INTO quiz_assignments (quizId, userId)
    VALUES (?, ?);
  `
  );

  const create = db.transaction(() => {
    const normalizedAssigned = normalizeAssignedStudents(assignedStudentIds);
    const isQuizPublic = normalizeQuizVisibility(isPublic);
    const showAnswers = normalizeShowCorrect(showCorrectAnswers);
    const quizInfo = insertQuiz.run(
      trimmedTitle,
      String(description ?? "").trim() || null,
      createdBy ?? null,
      isQuizPublic,
      showAnswers
    );
    const quizId = quizInfo.lastInsertRowid;

    questions.forEach((question, index) => {
      const normalized = normalizeQuestion(question, index);
      insertQuestion.run(
        quizId,
        normalized.prompt,
        normalized.type,
        JSON.stringify(normalized.options),
        normalized.correctAnswerIndex,
        normalized.explanation,
        index
      );
    });

    if (!isQuizPublic && normalizedAssigned.length > 0) {
      normalizedAssigned.forEach((userId) => {
        insertAssignment.run(quizId, userId);
      });
    }

    return quizId;
  });

  return create();
}

export function updateQuiz(quizId, {
  title,
  description,
  questions,
  isPublic = true,
  showCorrectAnswers = false,
  assignedStudentIds = [],
} = {}) {
  const trimmedTitle = String(title ?? "").trim();
  if (!trimmedTitle) {
    throw new Error("Quiz title is required.");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Quiz must include at least one question.");
  }

  const db = getDb();
  const updateQuizStmt = db.prepare(
    `
    UPDATE quizzes
    SET title = ?, description = ?, isPublic = ?, showCorrectAnswers = ?
    WHERE id = ?;
  `
  );
  const deleteQuestions = db.prepare("DELETE FROM quiz_questions WHERE quizId = ?");
  const insertQuestion = db.prepare(
    `
    INSERT INTO quiz_questions
      (quizId, prompt, type, options, correctAnswerIndex, explanation, orderIndex)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `
  );
  const deleteAssignments = db.prepare(
    "DELETE FROM quiz_assignments WHERE quizId = ?"
  );
  const insertAssignment = db.prepare(
    `
    INSERT OR IGNORE INTO quiz_assignments (quizId, userId)
    VALUES (?, ?);
  `
  );

  const update = db.transaction(() => {
    const normalizedAssigned = normalizeAssignedStudents(assignedStudentIds);
    const isQuizPublic = normalizeQuizVisibility(isPublic);
    const showAnswers = normalizeShowCorrect(showCorrectAnswers);

    const info = updateQuizStmt.run(
      trimmedTitle,
      String(description ?? "").trim() || null,
      isQuizPublic,
      showAnswers,
      quizId
    );
    if (info.changes === 0) {
      return false;
    }

    deleteQuestions.run(quizId);
    questions.forEach((question, index) => {
      const normalized = normalizeQuestion(question, index);
      insertQuestion.run(
        quizId,
        normalized.prompt,
        normalized.type,
        JSON.stringify(normalized.options),
        normalized.correctAnswerIndex,
        normalized.explanation,
        index
      );
    });

    deleteAssignments.run(quizId);
    if (!isQuizPublic && normalizedAssigned.length > 0) {
      normalizedAssigned.forEach((userId) => {
        insertAssignment.run(quizId, userId);
      });
    }

    return true;
  });

  return update();
}

export function deleteQuiz(quizId) {
  const db = getDb();
  const info = db.prepare("DELETE FROM quizzes WHERE id = ?").run(quizId);
  return info.changes > 0;
}

export function copyQuiz(quizId, createdBy) {
  const db = getDb();
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId);
  if (!quiz) {
    return null;
  }

  const questions = db
    .prepare("SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex")
    .all(quizId)
    .map((question) => ({
      ...question,
      options: question.options ? JSON.parse(question.options) : [],
    }));

  const assignedStudentIds = getQuizAssignments(db, quizId);

  const newQuizId = createQuiz({
    title: `Copy of ${quiz.title}`,
    description: quiz.description,
    createdBy: createdBy ?? quiz.createdBy ?? null,
    questions,
    isPublic: quiz.isPublic ?? 1,
    showCorrectAnswers: quiz.showCorrectAnswers ?? 0,
    assignedStudentIds,
  });

  return newQuizId;
}

export function getAllQuizzes(userId) {
  const db = getDb();
  const role = getRoleById(userId)?.role;
  const baseQuery = `
    SELECT q.*, (
      SELECT COUNT(*) FROM quiz_questions WHERE quizId = q.id
    ) AS questionCount
    FROM quizzes q
  `;
  if (hasInstructorAccess(role)) {
    return db
      .prepare(
        `
        ${baseQuery}
        ORDER BY q.createdAt DESC, q.id DESC;
      `
      )
      .all();
  }

  return db
    .prepare(
      `
      ${baseQuery}
      WHERE q.isPublic = 1
         OR EXISTS (
           SELECT 1 FROM quiz_assignments qa
           WHERE qa.quizId = q.id AND qa.userId = ?
         )
      ORDER BY q.createdAt DESC, q.id DESC;
    `
    )
    .all(userId);
}

// Internal helper for server-side use - always includes correctAnswerIndex
function getQuizWithAnswers(quizId) {
  const db = getDb();
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId);
  if (!quiz) {
    return null;
  }

  const questions = db
    .prepare(
      "SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex"
    )
    .all(quizId)
    .map((question) => ({
      ...question,
      options: question.options ? JSON.parse(question.options) : [],
    }));

  return { ...quiz, questions };
}

export function getQuizById(quizId, userId) {
  const db = getDb();
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId);
  if (!quiz) {
    return null;
  }

  const role = getRoleById(userId)?.role;

  // Check roles to see if we should be allowed to look at correctAnswerIndex
  if (hasInstructorAccess(role)) {
    const questions = db
      .prepare(
        "SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex"
      )
      .all(quizId)
      .map((question) => ({
        ...question,
        options: question.options ? JSON.parse(question.options) : [],
      }));

    const assignedStudentIds = getQuizAssignments(db, quizId);
    return { ...quiz, questions, assignedStudentIds };
  }

  if (!canStudentAccessQuiz(db, quizId, userId)) {
    return null;
  }

  // Secure questions for students - excludes correctAnswerIndex
  const questions = db
    .prepare(
      "SELECT id, quizId, prompt, type, options, orderIndex FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex"
    )
    .all(quizId)
    .map((question) => ({
      ...question,
      options: question.options ? JSON.parse(question.options) : [],
    }));

  return { ...quiz, questions: shuffleArray(questions) };
}

export function submitQuiz({ quizId, userId, answers } = {}) {
  if (!quizId) {
    throw new Error("quizId is required.");
  }
  if (!userId) {
    throw new Error("userId is required.");
  }

  const quiz = getQuizWithAnswers(quizId);
  if (!quiz) {
    throw new Error("Quiz not found.");
  }

  const role = getRoleById(userId)?.role;
  if (!hasInstructorAccess(role)) {
    const db = getDb();
    if (!canStudentAccessQuiz(db, quizId, userId)) {
      throw new Error("You do not have access to this quiz.");
    }
  }

  const answerMap = new Map();
  if (Array.isArray(answers)) {
    answers.forEach((answer) => {
      const questionId = Number(answer?.questionId);
      const selectedAnswerIndex = Number.isInteger(answer?.selectedAnswerIndex)
        ? answer.selectedAnswerIndex
        : null;
      if (Number.isFinite(questionId)) {
        answerMap.set(questionId, selectedAnswerIndex);
      }
    });
  }

  const db = getDb();
  const insertSubmission = db.prepare(
    `
    INSERT INTO quiz_submissions (quizId, userId, score, total)
    VALUES (?, ?, ?, ?);
  `
  );
  const insertAnswer = db.prepare(
    `
    INSERT INTO quiz_submission_answers
      (submissionId, questionId, selectedAnswerIndex, isCorrect)
    VALUES (?, ?, ?, ?);
  `
  );

  const submit = db.transaction(() => {
    let score = 0;
    const total = quiz.questions.length;

    const submissionInfo = insertSubmission.run(quizId, userId, score, total);
    const submissionId = submissionInfo.lastInsertRowid;

    quiz.questions.forEach((question) => {
      const selectedAnswerIndex = answerMap.has(question.id)
        ? answerMap.get(question.id)
        : null;
      const isCorrect =
        selectedAnswerIndex !== null &&
        selectedAnswerIndex === question.correctAnswerIndex;

      if (isCorrect) {
        score += 1;
      }

      insertAnswer.run(
        submissionId,
        question.id,
        selectedAnswerIndex,
        isCorrect ? 1 : 0
      );
    });

    db.prepare(
      "UPDATE quiz_submissions SET score = ? WHERE id = ?"
    ).run(score, submissionId);

    const result = {
      submissionId,
      score,
      total,
      showCorrectAnswers: Boolean(quiz.showCorrectAnswers),
    };

    if (quiz.showCorrectAnswers) {
      result.answerKey = quiz.questions.map((question) => ({
        questionId: question.id,
        correctAnswerIndex: question.correctAnswerIndex,
        explanation: question.explanation ?? null,
      }));
    }

    return result;
  });

  return submit();
}

export function getUserQuizSubmissions(userId) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT s.*, q.title, q.isPublic, q.showCorrectAnswers
      FROM quiz_submissions s
      JOIN quizzes q ON q.id = s.quizId
      WHERE s.userId = ?
      ORDER BY s.submittedAt DESC, s.id DESC;
    `
    )
    .all(userId);
}

export function getSubmissionDetails(submissionId) {
  const db = getDb();

  const submission = db
    .prepare(`SELECT s.*, q.title FROM quiz_submissions s JOIN quizzes q ON q.id = s.quizId WHERE s.id = ?`)
    .get(submissionId);

  if (!submission) {
    return null;
  }

  const answers = db
    .prepare(
      `
      SELECT
        qa.selectedAnswerIndex,
        qa.isCorrect,
        qq.id AS questionId,
        qq.prompt,
        qq.type,
        qq.options,
        qq.correctAnswerIndex,
        qq.orderIndex
      FROM quiz_submission_answers qa
      JOIN quiz_questions qq ON qq.id = qa.questionId
      WHERE qa.submissionId = ?
      ORDER BY qq.orderIndex;
    `
    )
    .all(submissionId)
    .map((row) => ({
      ...row,
      options: row.options ? JSON.parse(row.options) : [],
    }));

  return { ...submission, answers };
}
