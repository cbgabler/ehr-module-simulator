import { jest } from "@jest/globals";

const mockPrepare = jest.fn();
const mockTransaction = jest.fn((fn) => fn);
const mockDb = { prepare: mockPrepare, transaction: mockTransaction };
const mockGetDb = jest.fn(() => mockDb);

const runResults = [];
const getResults = [];
const allResults = [];
let preparedStatements = [];

await jest.unstable_mockModule("../database/database.js", () => ({
  getDb: mockGetDb,
}));

await jest.unstable_mockModule("../database/models/users.js", () => ({
  getRoleById: jest.fn(() => ({ role: "student" })),
}));

const {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  submitQuiz,
  getUserQuizSubmissions,
} = await import("../database/models/quizzes.js");

beforeEach(() => {
  jest.clearAllMocks();
  runResults.length = 0;
  getResults.length = 0;
  allResults.length = 0;
  preparedStatements = [];

  mockPrepare.mockImplementation((sql) => {
    const statement = {
      sql,
      run: jest.fn(() =>
        runResults.length > 0 ? runResults.shift() : undefined
      ),
      get: jest.fn(() =>
        getResults.length > 0 ? getResults.shift() : undefined
      ),
      all: jest.fn(() =>
        allResults.length > 0 ? allResults.shift() : undefined
      ),
    };
    preparedStatements.push(statement);
    return statement;
  });
});

describe("quiz data model helpers", () => {
  test("createQuiz inserts quiz and questions", () => {
    runResults.push({ lastInsertRowid: 11 });

    const quizId = createQuiz({
      title: "Vitals Basics",
      description: "Test quiz",
      createdBy: 3,
      questions: [
        {
          prompt: "Heart rate normal range?",
          type: "multiple_choice",
          options: ["60-100", "20-30"],
          correctAnswerIndex: 0,
        },
        {
          prompt: "Fever is above 100.4F",
          type: "true_false",
          correctAnswerIndex: 0,
        },
      ],
    });

    expect(quizId).toBe(11);
    expect(preparedStatements[0].sql).toContain("INSERT INTO quizzes");
    expect(preparedStatements[1].sql).toContain("INSERT INTO quiz_questions");
    expect(preparedStatements[0].run).toHaveBeenCalledWith(
      "Vitals Basics",
      "Test quiz",
      3
    );
    expect(preparedStatements[1].run).toHaveBeenCalledTimes(2);
  });

  test("createQuiz throws when missing title or questions", () => {
    expect(() => createQuiz({ title: " " })).toThrow("Quiz title is required.");
    expect(() => createQuiz({ title: "Quiz", questions: [] })).toThrow(
      "Quiz must include at least one question."
    );
  });

  test("createQuiz validates multiple choice options", () => {
    runResults.push({ lastInsertRowid: 1 });
    expect(() =>
      createQuiz({
        title: "Quiz",
        questions: [
          {
            prompt: "Pick one",
            type: "multiple_choice",
            options: ["Only one"],
            correctAnswerIndex: 0,
          },
        ],
      })
    ).toThrow("Question 1 must have at least two options.");

    runResults.push({ lastInsertRowid: 2 });
    expect(() =>
      createQuiz({
        title: "Quiz",
        questions: [
          {
            prompt: "Pick one",
            type: "multiple_choice",
            options: ["", "Option"],
            correctAnswerIndex: 1,
          },
        ],
      })
    ).toThrow("Question 1 has empty options.");
  });

  test("getAllQuizzes returns quiz list", () => {
    allResults.push([
      { id: 2, title: "Quiz A", questionCount: 4 },
      { id: 3, title: "Quiz B", questionCount: 2 },
    ]);

    const quizzes = getAllQuizzes();

    expect(preparedStatements[0].sql).toContain("FROM quizzes");
    expect(quizzes).toEqual([
      { id: 2, title: "Quiz A", questionCount: 4 },
      { id: 3, title: "Quiz B", questionCount: 2 },
    ]);
  });

  test("getQuizById returns quiz with questions", () => {
    getResults.push({ id: 5, title: "Quiz" });
    allResults.push([
      {
        id: 12,
        prompt: "Question",
        type: "multiple_choice",
        options: JSON.stringify(["A", "B"]),
        correctAnswerIndex: 1,
      },
    ]);

    const quiz = getQuizById(5);

    expect(preparedStatements[0].sql).toContain("SELECT * FROM quizzes");
    expect(preparedStatements[1].sql).toContain("FROM quiz_questions");
    expect(quiz.questions).toEqual([
      {
        id: 12,
        prompt: "Question",
        type: "multiple_choice",
        options: ["A", "B"],
        correctAnswerIndex: 1,
      },
    ]);
  });

  test("submitQuiz stores submission and answers with score", () => {
    getResults.push({ id: 7, title: "Quiz" });
    allResults.push([
      {
        id: 21,
        prompt: "Q1",
        type: "multiple_choice",
        options: JSON.stringify(["A", "B"]),
        correctAnswerIndex: 0,
      },
      {
        id: 22,
        prompt: "Q2",
        type: "true_false",
        options: JSON.stringify(["True", "False"]),
        correctAnswerIndex: 1,
      },
    ]);
    runResults.push({ lastInsertRowid: 100 });

    const result = submitQuiz({
      quizId: 7,
      userId: 5,
      answers: [
        { questionId: 21, selectedAnswerIndex: 0 },
        { questionId: 22, selectedAnswerIndex: 0 },
      ],
    });

    expect(result).toEqual({ submissionId: 100, score: 1, total: 2 });
    const insertSubmission = preparedStatements.find((stmt) =>
      stmt.sql.includes("INSERT INTO quiz_submissions")
    );
    const insertAnswer = preparedStatements.find((stmt) =>
      stmt.sql.includes("INSERT INTO quiz_submission_answers")
    );
    const updateSubmission = preparedStatements.find((stmt) =>
      stmt.sql.includes("UPDATE quiz_submissions SET score")
    );

    expect(insertSubmission.run).toHaveBeenCalledWith(7, 5, 0, 2);
    expect(insertAnswer.run).toHaveBeenCalledTimes(2);
    expect(updateSubmission.run).toHaveBeenCalledWith(1, 100);
  });

  test("getUserQuizSubmissions returns submission list", () => {
    allResults.push([{ id: 1, quizId: 2, title: "Quiz" }]);

    const submissions = getUserQuizSubmissions(9);

    expect(preparedStatements[0].sql).toContain("FROM quiz_submissions");
    expect(submissions).toEqual([{ id: 1, quizId: 2, title: "Quiz" }]);
  });
});
