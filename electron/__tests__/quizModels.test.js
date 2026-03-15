import { jest } from '@jest/globals';

const mockPrepare = jest.fn();
const mockTransaction = jest.fn((fn) => fn);
const mockDb = { prepare: mockPrepare, transaction: mockTransaction };
const mockGetDb = jest.fn(() => mockDb);

const runResults = [];
const getResults = [];
const allResults = [];
let preparedStatements = [];

await jest.unstable_mockModule('../database/database.js', () => ({
  getDb: mockGetDb,
}));

await jest.unstable_mockModule('../database/models/users.js', () => ({
  getRoleById: jest.fn(() => ({ role: 'instructor' })),
}));

const {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  submitQuiz,
  getUserQuizSubmissions,
  getSubmissionDetails,
  updateQuiz,
  deleteQuiz,
} = await import('../database/models/quizzes.js');

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

describe('quiz data model helpers', () => {
  test('createQuiz inserts quiz and questions', () => {
    runResults.push({ lastInsertRowid: 11 });

    const quizId = createQuiz({
      title: 'Vitals Basics',
      description: 'Test quiz',
      createdBy: 3,
      questions: [
        {
          prompt: 'Heart rate normal range?',
          type: 'multiple_choice',
          options: ['60-100', '20-30'],
          correctAnswerIndex: 0,
        },
        {
          prompt: 'Fever is above 100.4F',
          type: 'true_false',
          correctAnswerIndex: 0,
        },
      ],
    });

    expect(quizId).toBe(11);
    expect(preparedStatements[0].sql).toContain('INSERT INTO quizzes');
    expect(preparedStatements[1].sql).toContain('INSERT INTO quiz_questions');
    expect(preparedStatements[0].run).toHaveBeenCalledWith(
      'Vitals Basics',
      'Test quiz',
      3,
      1,
      0
    );
    expect(preparedStatements[1].run).toHaveBeenCalledTimes(2);
  });

  test('createQuiz throws when missing title or questions', () => {
    expect(() => createQuiz({ title: ' ' })).toThrow('Quiz title is required.');
    expect(() => createQuiz({ title: 'Quiz', questions: [] })).toThrow(
      'Quiz must include at least one question.'
    );
  });

  test('createQuiz validates multiple choice options', () => {
    runResults.push({ lastInsertRowid: 1 });
    expect(() =>
      createQuiz({
        title: 'Quiz',
        questions: [
          {
            prompt: 'Pick one',
            type: 'multiple_choice',
            options: ['Only one'],
            correctAnswerIndex: 0,
          },
        ],
      })
    ).toThrow('Question 1 must have at least two options.');

    runResults.push({ lastInsertRowid: 2 });
    expect(() =>
      createQuiz({
        title: 'Quiz',
        questions: [
          {
            prompt: 'Pick one',
            type: 'multiple_choice',
            options: ['', 'Option'],
            correctAnswerIndex: 1,
          },
        ],
      })
    ).toThrow('Question 1 has empty options.');
  });

  test('getAllQuizzes returns quiz list', () => {
    allResults.push([
      { id: 2, title: 'Quiz A', questionCount: 4 },
      { id: 3, title: 'Quiz B', questionCount: 2 },
    ]);

    const quizzes = getAllQuizzes(4);

    expect(preparedStatements[0].sql).toContain('FROM quizzes');
    expect(quizzes).toEqual([
      { id: 2, title: 'Quiz A', questionCount: 4 },
      { id: 3, title: 'Quiz B', questionCount: 2 },
    ]);
  });

  test('getQuizById returns quiz with questions', () => {
    getResults.push({ id: 5, title: 'Quiz' });
    allResults.push([
      {
        id: 12,
        prompt: 'Question',
        type: 'multiple_choice',
        options: JSON.stringify(['A', 'B']),
        correctAnswerIndex: 1,
      },
    ]);
    allResults.push([]);

    const quiz = getQuizById(5, 4);

    expect(preparedStatements[0].sql).toContain('SELECT * FROM quizzes');
    expect(preparedStatements[1].sql).toContain('FROM quiz_questions');
    expect(quiz.questions).toEqual([
      {
        id: 12,
        prompt: 'Question',
        type: 'multiple_choice',
        options: ['A', 'B'],
        correctAnswerIndex: 1,
      },
    ]);
  });

  test('submitQuiz stores submission and answers with score', () => {
    getResults.push({ id: 7, title: 'Quiz' });
    allResults.push([
      {
        id: 21,
        prompt: 'Q1',
        type: 'multiple_choice',
        options: JSON.stringify(['A', 'B']),
        correctAnswerIndex: 0,
      },
      {
        id: 22,
        prompt: 'Q2',
        type: 'true_false',
        options: JSON.stringify(['True', 'False']),
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

    expect(result).toEqual({
      submissionId: 100,
      score: 1,
      total: 2,
      showCorrectAnswers: false,
    });
    const insertSubmission = preparedStatements.find((stmt) =>
      stmt.sql.includes('INSERT INTO quiz_submissions')
    );
    const insertAnswer = preparedStatements.find((stmt) =>
      stmt.sql.includes('INSERT INTO quiz_submission_answers')
    );
    const updateSubmission = preparedStatements.find((stmt) =>
      stmt.sql.includes('UPDATE quiz_submissions SET score')
    );

    expect(insertSubmission.run).toHaveBeenCalledWith(7, 5, 0, 2);
    expect(insertAnswer.run).toHaveBeenCalledTimes(2);
    expect(updateSubmission.run).toHaveBeenCalledWith(1, 100);
  });

  test('getUserQuizSubmissions returns submission list', () => {
    allResults.push([{ id: 1, quizId: 2, title: 'Quiz' }]);

    const submissions = getUserQuizSubmissions(9);

    expect(preparedStatements[0].sql).toContain('FROM quiz_submissions');
    expect(submissions).toEqual([{ id: 1, quizId: 2, title: 'Quiz' }]);
  });

  test('getSubmissionDetails returns breakdown with parsed options', () => {
    getResults.push({ id: 5, quizId: 2, score: 1, total: 2, title: 'Quiz' });
    allResults.push([
      {
        selectedAnswerIndex: 0,
        isCorrect: 1,
        questionId: 10,
        prompt: 'Heart rate normal range?',
        type: 'multiple_choice',
        options: JSON.stringify(['60-100 bpm', '10-20 bpm']),
        correctAnswerIndex: 0,
        orderIndex: 0,
      },
      {
        selectedAnswerIndex: 1,
        isCorrect: 0,
        questionId: 11,
        prompt: 'Fever is above 100.4F',
        type: 'true_false',
        options: JSON.stringify(['True', 'False']),
        correctAnswerIndex: 0,
        orderIndex: 1,
      },
    ]);

    const details = getSubmissionDetails(5);

    expect(preparedStatements[0].sql).toContain('FROM quiz_submissions');
    expect(preparedStatements[1].sql).toContain('FROM quiz_submission_answers');
    expect(details.id).toBe(5);
    expect(details.title).toBe('Quiz');
    expect(details.answers).toHaveLength(2);
    expect(details.answers[0].options).toEqual(['60-100 bpm', '10-20 bpm']);
    expect(details.answers[0].isCorrect).toBe(1);
    expect(details.answers[1].options).toEqual(['True', 'False']);
    expect(details.answers[1].isCorrect).toBe(0);
  });

  test('getSubmissionDetails returns null when submission not found', () => {
    getResults.push(undefined);

    const details = getSubmissionDetails(999);

    expect(details).toBeNull();
    expect(preparedStatements).toHaveLength(1);
  });

  test('updateQuiz rewrites quiz and questions', () => {
    runResults.push({ changes: 1 });

    const updated = updateQuiz(5, {
      title: 'Updated Quiz',
      description: 'New description',
      isPublic: false,
      showCorrectAnswers: true,
      assignedStudentIds: [2, 3],
      questions: [
        {
          prompt: 'New Question',
          type: 'multiple_choice',
          options: ['A', 'B'],
          correctAnswerIndex: 1,
          explanation: 'Because B is correct',
        },
      ],
    });

    expect(updated).toBe(true);
    expect(preparedStatements[0].sql).toContain('UPDATE quizzes');
    expect(preparedStatements[1].sql).toContain('DELETE FROM quiz_questions');
    expect(preparedStatements[2].sql).toContain('INSERT INTO quiz_questions');
    expect(preparedStatements[3].sql).toContain('DELETE FROM quiz_assignments');
  });

  test('updateQuiz returns false when quiz missing', () => {
    runResults.push({ changes: 0 });

    const updated = updateQuiz(12, {
      title: 'Missing Quiz',
      questions: [
        {
          prompt: 'Q',
          type: 'true_false',
          correctAnswerIndex: 0,
        },
      ],
    });

    expect(updated).toBe(false);
  });

  test('deleteQuiz removes quiz when found', () => {
    runResults.push({ changes: 1 });

    const deleted = deleteQuiz(3);

    expect(preparedStatements[0].sql).toContain('DELETE FROM quizzes');
    expect(deleted).toBe(true);
  });

  test('deleteQuiz returns false when nothing deleted', () => {
    runResults.push({ changes: 0 });

    const deleted = deleteQuiz(99);

    expect(deleted).toBe(false);
  });
});
