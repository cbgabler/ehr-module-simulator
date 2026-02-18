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
  };
};

export function createQuiz({ title, description, createdBy, questions } = {}) {
  const trimmedTitle = String(title ?? "").trim();
  if (!trimmedTitle) {
    throw new Error("Quiz title is required.");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Quiz must include at least one question.");
  }

  const db = getDb();
  const insertQuiz = db.prepare(
    `INSERT INTO quizzes (title, description, createdBy) VALUES (?, ?, ?);`
  );
  const insertQuestion = db.prepare(
    `
    INSERT INTO quiz_questions
      (quizId, prompt, type, options, correctAnswerIndex, orderIndex)
    VALUES (?, ?, ?, ?, ?, ?);
  `
  );

  const create = db.transaction(() => {
    const quizInfo = insertQuiz.run(
      trimmedTitle,
      String(description ?? "").trim() || null,
      createdBy ?? null
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
        index
      );
    });

    return quizId;
  });

  return create();
}

export function getAllQuizzes() {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT q.*, (
        SELECT COUNT(*) FROM quiz_questions WHERE quizId = q.id
      ) AS questionCount
      FROM quizzes q
      ORDER BY q.createdAt DESC, q.id DESC;
    `
    )
    .all();
}

export function getQuizById(quizId, userId) {
  const db = getDb();
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId);
  if (!quiz) {
    return null;
  }

  const userPerms = getRoleById(userId);

  // Exposed questions for instructors/admins
  const questions = db
    .prepare(
      "SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex"
    )
    .all(quizId)
    .map((question) => ({
      ...question,
      options: question.options ? JSON.parse(question.options) : [],
    }));

  // Secure question dict for students
  const secureQuestions = db
  .prepare(
    "SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY orderIndex"
  )
  .all(quizId)
  .map((question) => ({
    ...question,
    options: question.options ? JSON.parse(question.options) : [],
  }));
  
  // Check roles to see if we should be allowed to look at correctIndex
  if (userPerms.role == 'admin' || userPerms.role == 'instructor') {
    return { ...quiz, questions };
  }

  /* 
  This should only be used for instructors or admins
  If we use select * the correct index will be exposed to the frontend
  Check roles first
  */

  return { ...quiz, questions };
}

export function submitQuiz({ quizId, userId, answers } = {}) {
  if (!quizId) {
    throw new Error("quizId is required.");
  }
  if (!userId) {
    throw new Error("userId is required.");
  }

  const quiz = getQuizById(quizId);
  if (!quiz) {
    throw new Error("Quiz not found.");
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

    return { submissionId, score, total };
  });

  return submit();
}

export function getUserQuizSubmissions(userId) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT s.*, q.title
      FROM quiz_submissions s
      JOIN quizzes q ON q.id = s.quizId
      WHERE s.userId = ?
      ORDER BY s.submittedAt DESC, s.id DESC;
    `
    )
    .all(userId);
}
