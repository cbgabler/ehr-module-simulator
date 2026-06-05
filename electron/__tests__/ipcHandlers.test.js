import { jest } from '@jest/globals';

async function loadMainWithScenarioMocks() {
  jest.resetModules();

  const mockWindowInstance = {
    loadURL: jest.fn(),
    loadFile: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
      on: jest.fn(),
      setWindowOpenHandler: jest.fn(),
    },
  };
  const mockBrowserWindow = jest.fn(() => mockWindowInstance);
  const mockIpcHandle = jest.fn();

  const mockApp = {
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn(),
    getPath: jest.fn(() => '/tmp/test-user-data'),
  };
  Object.defineProperty(mockApp, 'isPackaged', {
    get: () => false,
  });

  const userMocks = {
    registerUser: jest.fn(),
    authenticateUser: jest.fn(),
    getRoleById: jest.fn(),
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
  };

  const scenarioMocks = {
    getAllScenarios: jest.fn(),
    getScenarioById: jest.fn(),
    deleteScenario: jest.fn(),
    createScenario: jest.fn(),
    duplicateScenario: jest.fn(),
  };

  const quizMocks = {
    createQuiz: jest.fn(),
    getAllQuizzes: jest.fn(),
    getQuizById: jest.fn(),
    submitQuiz: jest.fn(),
    getUserQuizSubmissions: jest.fn(),
    getSubmissionDetails: jest.fn(),
    updateQuiz: jest.fn(),
    deleteQuiz: jest.fn(),
    copyQuiz: jest.fn(),
  };

  const sessionMocks = {
    addSessionNote: jest.fn(),
    getSessionNotes: jest.fn(),
    deleteSessionNote: jest.fn(),
  };

  const sessionLogMocks = {
    getSessionSummaryBySessionId: jest.fn(),
    getUserSessionSummaries: jest.fn(),
  };

  const summaryExportMocks = {
    exportSessionSummaryPdf: jest.fn(),
  };

  await jest.unstable_mockModule('electron', () => ({
    app: mockApp,
    BrowserWindow: mockBrowserWindow,
    ipcMain: { handle: mockIpcHandle },
    dialog: {
      showOpenDialog: jest.fn(),
      showSaveDialog: jest.fn(),
    },
    Menu: {
      setApplicationMenu: jest.fn(),
    },
    session: {
      defaultSession: {
        webRequest: {
          onHeadersReceived: jest.fn(),
        },
        setPermissionRequestHandler: jest.fn(),
      },
    },
    shell: {
      openExternal: jest.fn(() => Promise.resolve()),
    },
  }));

  await jest.unstable_mockModule('../database/database.js', () => ({
    initDatabase: jest.fn(),
    getDb: jest.fn(),
  }));

  await jest.unstable_mockModule(
    '../database/models/users.js',
    () => userMocks
  );

  await jest.unstable_mockModule(
    '../database/models/scenarios.js',
    () => scenarioMocks
  );

  await jest.unstable_mockModule(
    '../database/models/quizzes.js',
    () => quizMocks
  );

  await jest.unstable_mockModule(
    '../database/models/sessions.js',
    () => sessionMocks
  );

  await jest.unstable_mockModule(
    '../database/models/sessionLogs.js',
    () => sessionLogMocks
  );

  await jest.unstable_mockModule('../database/exampleScenarios.js', () => ({
    seedExampleScenarios: jest.fn(),
  }));
  const simulationMocks = {
    startSession: jest.fn(),
    getSessionState: jest.fn(),
    adjustMedication: jest.fn(),
    pauseSession: jest.fn(),
    resumeSession: jest.fn(),
    endSession: jest.fn(),
    getSession: jest.fn(),
  };

  await jest.unstable_mockModule(
    '../database/simulation.js',
    () => simulationMocks
  );

  await jest.unstable_mockModule('../database/progress/import.js', () => ({
    importData: jest.fn(),
  }));

  await jest.unstable_mockModule('../database/progress/export.js', () => ({
    exportData: jest.fn(),
  }));

  await jest.unstable_mockModule('../utils/summaryExport.js', () => summaryExportMocks);

  const electron = await import('electron');
  await import('../main.js');

  return {
    electron,
    userMocks,
    scenarioMocks,
    quizMocks,
    sessionMocks,
    sessionLogMocks,
    mockIpcHandle,
    simulationMocks,
    summaryExportMocks,
  };
}

const findHandler = (ipcMock, channel) => {
  const handlerCall = ipcMock.mock.calls.find(([name]) => name === channel);
  if (!handlerCall) {
    throw new Error(`Handler for ${channel} not registered`);
  }
  return handlerCall[1];
};

// Mock event with senderFrame for IPC sender validation
// In dev mode (isPackaged: false), validates against localhost:5173
const mockEvent = {
  senderFrame: {
    url: 'http://localhost:5173/',
  },
};

describe('scenario IPC handlers', () => {
  test('get-all-scenarios returns payload on success', async () => {
    const { mockIpcHandle, scenarioMocks } = await loadMainWithScenarioMocks();
    const scenarios = [{ id: 1, name: 'Example' }];
    scenarioMocks.getAllScenarios.mockReturnValueOnce(scenarios);

    const handler = findHandler(mockIpcHandle, 'get-all-scenarios');
    const response = await handler(mockEvent);

    expect(scenarioMocks.getAllScenarios).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ success: true, scenarios });
  });

  test('get-all-scenarios reports errors', async () => {
    const { mockIpcHandle, scenarioMocks } = await loadMainWithScenarioMocks();
    const err = new Error('db down');
    scenarioMocks.getAllScenarios.mockImplementation(() => {
      throw err;
    });

    const handler = findHandler(mockIpcHandle, 'get-all-scenarios');
    const response = await handler(mockEvent);

    expect(response).toEqual({ success: false, error: err.message });
  });

  test('get-scenario returns record when found', async () => {
    const { mockIpcHandle, scenarioMocks } = await loadMainWithScenarioMocks();
    const scenario = { id: 3, name: 'Case' };
    scenarioMocks.getScenarioById.mockReturnValueOnce(scenario);

    const handler = findHandler(mockIpcHandle, 'get-scenario');
    const response = await handler(mockEvent, 3);

    expect(scenarioMocks.getScenarioById).toHaveBeenCalledWith(3);
    expect(response).toEqual({ success: true, scenario });
  });

  test('get-scenario returns error when not found', async () => {
    const { mockIpcHandle, scenarioMocks } = await loadMainWithScenarioMocks();
    scenarioMocks.getScenarioById.mockReturnValueOnce(undefined);

    const handler = findHandler(mockIpcHandle, 'get-scenario');
    const response = await handler(mockEvent, 7);

    expect(response).toEqual({
      success: false,
      error: 'Scenario not found',
    });
  });

  test('get-scenario surfaces thrown errors', async () => {
    const { mockIpcHandle, scenarioMocks } = await loadMainWithScenarioMocks();
    scenarioMocks.getScenarioById.mockImplementation(() => {
      throw new Error('boom');
    });

    const handler = findHandler(mockIpcHandle, 'get-scenario');
    const response = await handler(mockEvent, 9);

    expect(response).toEqual({ success: false, error: 'boom' });
  });
});

describe('auth IPC handlers', () => {
  test('register-user returns new user on success', async () => {
    const { mockIpcHandle, userMocks } = await loadMainWithScenarioMocks();
    const mockUser = { id: 4, username: 'nurse', role: 'student' };
    userMocks.registerUser.mockReturnValueOnce(mockUser);

    const handler = findHandler(mockIpcHandle, 'register-user');
    const payload = {
      username: 'nurse',
      password: 'Secret1!',
      role: 'student',
    };
    const response = await handler(mockEvent, payload);

    expect(userMocks.registerUser).toHaveBeenCalledWith(payload);
    expect(response).toEqual({ success: true, user: mockUser });
  });

  test('register-user reports underlying errors', async () => {
    const { mockIpcHandle, userMocks } = await loadMainWithScenarioMocks();
    userMocks.registerUser.mockImplementation(() => {
      throw new Error('taken');
    });

    const handler = findHandler(mockIpcHandle, 'register-user');
    const response = await handler(mockEvent, { username: 'dupe' });

    expect(response).toEqual({ success: false, error: 'taken' });
  });

  test('login-user returns authenticated user', async () => {
    const { mockIpcHandle, userMocks } = await loadMainWithScenarioMocks();
    const mockUser = { id: 2, username: 'educator', role: 'instructor' };
    userMocks.authenticateUser.mockReturnValueOnce(mockUser);

    const handler = findHandler(mockIpcHandle, 'login-user');
    const response = await handler(mockEvent, {
      username: 'educator',
      password: 'StrongPass1!',
    });

    expect(userMocks.authenticateUser).toHaveBeenCalledWith(
      'educator',
      'StrongPass1!'
    );
    expect(response).toEqual({ success: true, user: mockUser });
  });

  test('login-user surfaces authentication failures', async () => {
    const { mockIpcHandle, userMocks } = await loadMainWithScenarioMocks();
    userMocks.authenticateUser.mockImplementation(() => {
      throw new Error('Invalid credentials');
    });

    const handler = findHandler(mockIpcHandle, 'login-user');
    const response = await handler(mockEvent, {
      username: 'educator',
      password: 'bad',
    });

    expect(response).toEqual({
      success: false,
      error: 'Invalid credentials',
    });
  });

  test('sign-out clears the current session', async () => {
    const { mockIpcHandle, userMocks } = await loadMainWithScenarioMocks();

    const mockUser = { id: 5, username: 'student1', role: 'student' };
    userMocks.authenticateUser.mockReturnValueOnce(mockUser);
    const loginHandler = findHandler(mockIpcHandle, 'login-user');
    await loginHandler(mockEvent, { username: 'student1', password: 'pass' });

    const signOutHandler = findHandler(mockIpcHandle, 'sign-out');
    const signOutResponse = await signOutHandler();
    expect(signOutResponse).toEqual({ success: true });

    const submissionsHandler = findHandler(mockIpcHandle, 'get-user-quiz-submissions');
    const response = await submissionsHandler();
    expect(response).toEqual({ success: false, error: 'No user logged in' });
  });

  test('restore-session hydrates current user when found', async () => {
    const { mockIpcHandle, userMocks } = await loadMainWithScenarioMocks();
    userMocks.getUserById.mockReturnValueOnce({
      id: 9,
      username: 'auto',
      role: 'student',
    });

    const handler = findHandler(mockIpcHandle, 'restore-session');
    const response = await handler(null, { userId: 9 });

    expect(userMocks.getUserById).toHaveBeenCalledWith(9);
    expect(response).toEqual({
      success: true,
      user: { id: 9, username: 'auto', role: 'student' },
    });
  });

  test('restore-session returns error when user missing', async () => {
    const { mockIpcHandle, userMocks } = await loadMainWithScenarioMocks();
    userMocks.getUserById.mockReturnValueOnce(undefined);

    const handler = findHandler(mockIpcHandle, 'restore-session');
    const response = await handler(null, { userId: 14 });

    expect(response).toEqual({ success: false, error: 'User not found' });
  });
});

describe('simulation IPC handlers', () => {
  test('start-sim returns session data', async () => {
    const { mockIpcHandle, simulationMocks } =
      await loadMainWithScenarioMocks();
    const sessionState = { status: 'running' };
    simulationMocks.startSession.mockReturnValueOnce({
      sessionId: 12,
      state: sessionState,
    });

    const handler = findHandler(mockIpcHandle, 'start-sim');
    const result = await handler(mockEvent, { scenarioId: 3, userId: 9 });

    expect(simulationMocks.startSession).toHaveBeenCalledWith(3, 9, { mode: undefined });
    expect(result).toEqual({
      success: true,
      sessionId: 12,
      state: sessionState,
    });
  });

  test('start-sim reports errors', async () => {
    const { mockIpcHandle, simulationMocks } =
      await loadMainWithScenarioMocks();
    simulationMocks.startSession.mockImplementation(() => {
      throw new Error('nope');
    });

    const handler = findHandler(mockIpcHandle, 'start-sim');
    const result = await handler(mockEvent, { scenarioId: 3, userId: 9 });

    expect(result).toEqual({ success: false, error: 'nope' });
  });

  test('get-sim-state proxies to session manager', async () => {
    const { mockIpcHandle, simulationMocks } =
      await loadMainWithScenarioMocks();
    const state = { tickCount: 2 };
    simulationMocks.getSessionState.mockReturnValueOnce(state);

    const handler = findHandler(mockIpcHandle, 'get-sim-state');
    const result = await handler(mockEvent, { sessionId: 55 });

    expect(simulationMocks.getSessionState).toHaveBeenCalledWith(55);
    expect(result).toEqual({ success: true, state });
  });

  test('adjust-sim-medication validates numeric dose', async () => {
    const { mockIpcHandle, simulationMocks } =
      await loadMainWithScenarioMocks();
    const state = { tickCount: 5 };
    simulationMocks.adjustMedication.mockReturnValueOnce(state);

    const handler = findHandler(mockIpcHandle, 'adjust-sim-medication');
    const payload = { sessionId: 1, medicationId: 'med', newDose: 12 };
    const result = await handler(mockEvent, payload);

    expect(simulationMocks.adjustMedication).toHaveBeenCalledWith(
      payload.sessionId,
      payload.medicationId,
      payload.newDose
    );
    expect(result).toEqual({ success: true, state });
  });

  test('pause-sim and resume-sim invoke matching helpers', async () => {
    const { mockIpcHandle, simulationMocks } =
      await loadMainWithScenarioMocks();
    const paused = { status: 'paused' };
    const resumed = { status: 'running' };
    simulationMocks.pauseSession.mockReturnValueOnce(paused);
    simulationMocks.resumeSession.mockReturnValueOnce(resumed);

    const pauseHandler = findHandler(mockIpcHandle, 'pause-sim');
    const resumeHandler = findHandler(mockIpcHandle, 'resume-sim');

    expect(await pauseHandler(mockEvent, { sessionId: 9 })).toEqual({
      success: true,
      state: paused,
    });
    expect(await resumeHandler(mockEvent, { sessionId: 9 })).toEqual({
      success: true,
      state: resumed,
    });
  });

  test('end-sim stops the session and returns final state', async () => {
    const { mockIpcHandle, simulationMocks, sessionLogMocks } =
      await loadMainWithScenarioMocks();
    const finalState = { status: 'ended' };
    const summary = { id: 1, sessionId: 5, summary: 'Summary' };
    simulationMocks.endSession.mockReturnValueOnce(finalState);
    sessionLogMocks.getSessionSummaryBySessionId.mockReturnValueOnce(summary);

    const handler = findHandler(mockIpcHandle, 'end-sim');
    const result = await handler(mockEvent, { sessionId: 5 });

    expect(simulationMocks.endSession).toHaveBeenCalledWith(5, {
      reason: 'user_end',
    });
    expect(result).toEqual({ success: true, state: finalState, summary });
  });

  test('get-session-summary returns stored summary', async () => {
    const { mockIpcHandle, sessionLogMocks } =
      await loadMainWithScenarioMocks();
    const summary = { id: 2, sessionId: 9, summary: 'Stored summary' };
    sessionLogMocks.getSessionSummaryBySessionId.mockReturnValueOnce(summary);

    const handler = findHandler(mockIpcHandle, 'get-session-summary');
    const result = await handler(mockEvent, { sessionId: 9 });

    expect(sessionLogMocks.getSessionSummaryBySessionId).toHaveBeenCalledWith(9);
    expect(result).toEqual({ success: true, summary });
  });

  test('get-session-summaries returns user summaries', async () => {
    const { mockIpcHandle, sessionLogMocks } =
      await loadMainWithScenarioMocks();
    const summaries = [
      { id: 1, sessionId: 7, userId: 3, summary: 'Summary' },
    ];
    sessionLogMocks.getUserSessionSummaries.mockReturnValueOnce(summaries);

    const handler = findHandler(mockIpcHandle, 'get-session-summaries');
    const result = await handler(mockEvent, { userId: 3 });

    expect(sessionLogMocks.getUserSessionSummaries).toHaveBeenCalledWith(3);
    expect(result).toEqual({ success: true, summaries });
  });
});

describe('documentation IPC handlers', () => {
  test('add-note stores note via data model', async () => {
    const { mockIpcHandle, sessionMocks, simulationMocks } =
      await loadMainWithScenarioMocks();
    simulationMocks.getSession.mockReturnValueOnce({ id: 7 });
    const savedNote = { id: 1, content: 'note' };
    sessionMocks.addSessionNote.mockReturnValueOnce(savedNote);

    const handler = findHandler(mockIpcHandle, 'add-note');
    const payload = {
      sessionId: 5,
      userId: 3,
      content: 'note',
      vitalsSnapshot: { heartRate: 90 },
    };
    const result = await handler(mockEvent, payload);

    expect(simulationMocks.getSession).toHaveBeenCalledWith(5);
    expect(sessionMocks.addSessionNote).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true, note: savedNote });
  });

  test('get-notes returns session notes', async () => {
    const { mockIpcHandle, sessionMocks } = await loadMainWithScenarioMocks();
    const notes = [{ id: 1, content: 'note' }];
    sessionMocks.getSessionNotes.mockReturnValueOnce(notes);

    const handler = findHandler(mockIpcHandle, 'get-notes');
    const result = await handler(mockEvent, { sessionId: 3 });

    expect(sessionMocks.getSessionNotes).toHaveBeenCalledWith(3);
    expect(result).toEqual({ success: true, notes });
  });

  test('delete-note removes note when authorized', async () => {
    const { mockIpcHandle, sessionMocks } = await loadMainWithScenarioMocks();
    const note = { id: 2, content: 'note' };
    sessionMocks.deleteSessionNote.mockReturnValueOnce(note);

    const handler = findHandler(mockIpcHandle, 'delete-note');
    const result = await handler(mockEvent, { noteId: 2, userId: 3 });

    expect(sessionMocks.deleteSessionNote).toHaveBeenCalledWith({
      noteId: 2,
      userId: 3,
    });
    expect(result).toEqual({ success: true, note });
  });
});

describe('quiz IPC handlers', () => {
  test('get-all-quizzes returns list', async () => {
    const { mockIpcHandle, quizMocks, userMocks } = await loadMainWithScenarioMocks();
    const quizzes = [{ id: 1, title: 'Quiz' }];
    quizMocks.getAllQuizzes.mockReturnValueOnce(quizzes);
    userMocks.authenticateUser.mockReturnValueOnce({
      id: 3,
      username: 'student',
      role: 'student',
    });
    userMocks.getRoleById.mockReturnValueOnce({ role: 'student' });

    const loginHandler = findHandler(mockIpcHandle, 'login-user');
    await loginHandler(mockEvent, { username: 'student', password: 'pass' });

    const handler = findHandler(mockIpcHandle, 'get-all-quizzes');
    const response = await handler();

    expect(quizMocks.getAllQuizzes).toHaveBeenCalledWith(3);
    expect(response).toEqual({ success: true, quizzes });
  });

  test('get-quiz returns quiz when found', async () => {
    const { mockIpcHandle, quizMocks, userMocks } = await loadMainWithScenarioMocks();
    const quiz = { id: 2, title: 'Quiz' };
    quizMocks.getQuizById.mockReturnValueOnce(quiz);
    userMocks.authenticateUser.mockReturnValueOnce({
      id: 5,
      username: 'student',
      role: 'student',
    });
    userMocks.getRoleById.mockReturnValueOnce({ role: 'student' });

    const loginHandler = findHandler(mockIpcHandle, 'login-user');
    await loginHandler(mockEvent, { username: 'student', password: 'pass' });

    const handler = findHandler(mockIpcHandle, 'get-quiz');
    const response = await handler(null, 2);

    expect(quizMocks.getQuizById).toHaveBeenCalledWith(2, 5);
    expect(response).toEqual({ success: true, quiz });
  });

  test('get-quiz returns error when missing', async () => {
    const { mockIpcHandle, quizMocks, userMocks } = await loadMainWithScenarioMocks();
    quizMocks.getQuizById.mockReturnValueOnce(undefined);
    userMocks.authenticateUser.mockReturnValueOnce({
      id: 7,
      username: 'student',
      role: 'student',
    });
    userMocks.getRoleById.mockReturnValueOnce({ role: 'student' });

    const loginHandler = findHandler(mockIpcHandle, 'login-user');
    await loginHandler(mockEvent, { username: 'student', password: 'pass' });

    const handler = findHandler(mockIpcHandle, 'get-quiz');
    const response = await handler(null, 9);

    expect(response).toEqual({ success: false, error: 'Quiz not found' });
  });

  test('create-quiz returns new ID', async () => {
    const { mockIpcHandle, quizMocks, userMocks } = await loadMainWithScenarioMocks();
    quizMocks.createQuiz.mockReturnValueOnce(44);
    userMocks.authenticateUser.mockReturnValueOnce({
      id: 11,
      username: 'teacher',
      role: 'instructor',
    });
    userMocks.getRoleById.mockReturnValueOnce({ role: 'instructor' });

    const loginHandler = findHandler(mockIpcHandle, 'login-user');
    await loginHandler(mockEvent, { username: 'teacher', password: 'pass' });

    const handler = findHandler(mockIpcHandle, 'create-quiz');
    const payload = { title: 'Quiz', questions: [{ prompt: 'Q1' }] };
    const response = await handler(null, payload);

    expect(quizMocks.createQuiz).toHaveBeenCalledWith({
      ...payload,
      createdBy: 11,
    });
    expect(response).toEqual({ success: true, quizId: 44 });
  });

  test('update-quiz updates quiz for instructors', async () => {
    const { mockIpcHandle, quizMocks, userMocks } = await loadMainWithScenarioMocks();
    quizMocks.updateQuiz.mockReturnValueOnce(true);
    userMocks.authenticateUser.mockReturnValueOnce({
      id: 20,
      username: 'teacher',
      role: 'instructor',
    });
    userMocks.getRoleById.mockReturnValueOnce({ role: 'instructor' });

    const loginHandler = findHandler(mockIpcHandle, 'login-user');
    await loginHandler(mockEvent, { username: 'teacher', password: 'pass' });

    const handler = findHandler(mockIpcHandle, 'update-quiz');
    const response = await handler(null, {
      quizId: 3,
      updates: { title: 'Updated', questions: [{ prompt: 'Q1' }] },
    });

    expect(quizMocks.updateQuiz).toHaveBeenCalledWith(3, {
      title: 'Updated',
      questions: [{ prompt: 'Q1' }],
    });
    expect(response).toEqual({ success: true });
  });

  test('delete-quiz removes quiz for instructors', async () => {
    const { mockIpcHandle, quizMocks, userMocks } = await loadMainWithScenarioMocks();
    quizMocks.deleteQuiz.mockReturnValueOnce(true);
    userMocks.authenticateUser.mockReturnValueOnce({
      id: 21,
      username: 'teacher',
      role: 'instructor',
    });
    userMocks.getRoleById.mockReturnValueOnce({ role: 'instructor' });

    const loginHandler = findHandler(mockIpcHandle, 'login-user');
    await loginHandler(mockEvent, { username: 'teacher', password: 'pass' });

    const handler = findHandler(mockIpcHandle, 'delete-quiz');
    const response = await handler(null, 7);

    expect(quizMocks.deleteQuiz).toHaveBeenCalledWith(7);
    expect(response).toEqual({ success: true });
  });

  test('copy-quiz duplicates quiz for instructors', async () => {
    const { mockIpcHandle, quizMocks, userMocks } = await loadMainWithScenarioMocks();
    quizMocks.copyQuiz.mockReturnValueOnce(99);
    userMocks.authenticateUser.mockReturnValueOnce({
      id: 22,
      username: 'teacher',
      role: 'instructor',
    });
    userMocks.getRoleById.mockReturnValueOnce({ role: 'instructor' });

    const loginHandler = findHandler(mockIpcHandle, 'login-user');
    await loginHandler(mockEvent, { username: 'teacher', password: 'pass' });

    const handler = findHandler(mockIpcHandle, 'copy-quiz');
    const response = await handler(null, 5);

    expect(quizMocks.copyQuiz).toHaveBeenCalledWith(5, 22);
    expect(response).toEqual({ success: true, quizId: 99 });
  });

  test('submit-quiz returns scoring payload', async () => {
    const { mockIpcHandle, quizMocks, userMocks } = await loadMainWithScenarioMocks();
    const result = { submissionId: 1, score: 2, total: 3 };
    quizMocks.submitQuiz.mockReturnValueOnce(result);
    userMocks.authenticateUser.mockReturnValueOnce({
      id: 2,
      username: 'student',
      role: 'student',
    });
    userMocks.getRoleById.mockReturnValueOnce({ role: 'student' });

    const loginHandler = findHandler(mockIpcHandle, 'login-user');
    await loginHandler(mockEvent, { username: 'student', password: 'pass' });

    const handler = findHandler(mockIpcHandle, 'submit-quiz');
    const payload = { quizId: 1, userId: 2, answers: [] };
    const response = await handler(null, payload);

    expect(quizMocks.submitQuiz).toHaveBeenCalledWith({ ...payload, userId: 2 });
    expect(response).toEqual({ success: true, result });
  });

  test('get-user-quiz-submissions returns list for logged-in user', async () => {
    const { mockIpcHandle, quizMocks, userMocks } = await loadMainWithScenarioMocks();
    const submissions = [{ id: 1, quizId: 2 }];
    quizMocks.getUserQuizSubmissions.mockReturnValueOnce(submissions);

    const mockUser = { id: 3, username: 'testuser', role: 'student' };
    userMocks.authenticateUser.mockReturnValueOnce(mockUser);
    const loginHandler = findHandler(mockIpcHandle, 'login-user');
    await loginHandler(mockEvent, { username: 'testuser', password: 'pass' });

    const handler = findHandler(mockIpcHandle, 'get-user-quiz-submissions');
    const response = await handler();

    expect(quizMocks.getUserQuizSubmissions).toHaveBeenCalledWith(3);
    expect(response).toEqual({ success: true, submissions });
  });

  test('get-user-quiz-submissions fails when not logged in', async () => {
    const { mockIpcHandle } = await loadMainWithScenarioMocks();

    const handler = findHandler(mockIpcHandle, 'get-user-quiz-submissions');
    const response = await handler();

    expect(response).toEqual({ success: false, error: 'No user logged in' });
  });

  test('get-quiz-submission-details returns breakdown when found', async () => {
    const { mockIpcHandle, quizMocks } = await loadMainWithScenarioMocks();
    const details = { id: 1, title: 'Quiz', score: 3, total: 4, answers: [] };
    quizMocks.getSubmissionDetails.mockReturnValueOnce(details);

    const handler = findHandler(mockIpcHandle, 'get-quiz-submission-details');
    const response = await handler(null, { submissionId: 1 });

    expect(quizMocks.getSubmissionDetails).toHaveBeenCalledWith(1);
    expect(response).toEqual({ success: true, details });
  });

  test('get-quiz-submission-details returns error when not found', async () => {
    const { mockIpcHandle, quizMocks } = await loadMainWithScenarioMocks();
    quizMocks.getSubmissionDetails.mockReturnValueOnce(null);

    const handler = findHandler(mockIpcHandle, 'get-quiz-submission-details');
    const response = await handler(null, { submissionId: 99 });

    expect(response).toEqual({ success: false, error: 'Submission not found.' });
  });
});

describe('summary export IPC handler', () => {
  test('export-session-summary-pdf returns util payload', async () => {
    const { mockIpcHandle, summaryExportMocks } =
      await loadMainWithScenarioMocks();
    summaryExportMocks.exportSessionSummaryPdf.mockResolvedValueOnce({
      success: true,
      filePath: '/tmp/summary.pdf',
    });

    const handler = findHandler(mockIpcHandle, 'export-session-summary-pdf');
    const payload = { summaryText: 'Summary' };
    const result = await handler(null, payload);

    expect(summaryExportMocks.exportSessionSummaryPdf).toHaveBeenCalledWith(
      payload
    );
    expect(result).toEqual({ success: true, filePath: '/tmp/summary.pdf' });
  });

  test('export-session-summary-pdf reports errors', async () => {
    const { mockIpcHandle, summaryExportMocks } =
      await loadMainWithScenarioMocks();
    summaryExportMocks.exportSessionSummaryPdf.mockImplementation(() => {
      throw new Error('export failed');
    });

    const handler = findHandler(mockIpcHandle, 'export-session-summary-pdf');
    const result = await handler(null, { summaryText: 'Summary' });

    expect(result).toEqual({ success: false, error: 'export failed' });
  });
});

describe('open-external-url IPC handler', () => {
  test('opens URL via shell.openExternal', async () => {
    const { electron, mockIpcHandle } = await loadMainWithScenarioMocks();
    const handler = findHandler(mockIpcHandle, 'open-external-url');
    const result = await handler(null, 'https://forms.google.com/test');

    expect(electron.shell.openExternal).toHaveBeenCalledWith(
      'https://forms.google.com/test'
    );
    expect(result).toEqual({ success: true });
  });

  test('reports shell errors', async () => {
    const { electron, mockIpcHandle } = await loadMainWithScenarioMocks();
    electron.shell.openExternal.mockRejectedValueOnce(
      new Error('Failed to open')
    );

    const handler = findHandler(mockIpcHandle, 'open-external-url');
    const result = await handler(null, 'https://example.com');

    expect(result).toEqual({ success: false, error: 'Failed to open' });
  });

  test('rejects missing or invalid URL', async () => {
    const { mockIpcHandle } = await loadMainWithScenarioMocks();
    const handler = findHandler(mockIpcHandle, 'open-external-url');

    const result = await handler(null, undefined);
    expect(result).toEqual({
      success: false,
      error: 'A valid URL string is required',
    });
  });
});
