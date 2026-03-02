import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import { initDatabase } from "./database/database.js";
import { exportSessionSummaryPdf } from "./utils/summaryExport.js";

// Users
import { 
  authenticateUser, 
  registerUser,
  getAllUsers,
  getRoleById,
  getUserById,
} from "./database/models/users.js";

// Scenarios
import {
  getAllScenarios,
  getScenarioById,
  createScenario,
  deleteScenario,
  duplicateScenario
} from "./database/models/scenarios.js";

// Quizzes
import {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  submitQuiz,
  getUserQuizSubmissions,
  getSubmissionDetails,
  updateQuiz,
  deleteQuiz,
  copyQuiz,
} from "./database/models/quizzes.js";

// Sessions
import {
  addSessionNote,
  getSessionNotes,
  deleteSessionNote
} from "./database/models/sessions.js";
import {
  getSessionSummaryBySessionId,
  getUserSessionSummaries,
} from "./database/models/sessionLogs.js";

// Simulation deps
import {
  startSession,
  getSessionState,
  adjustMedication,
  pauseSession,
  resumeSession,
  endSession,
  getSession,
} from "./database/simulation.js";
import { seedExampleScenarios } from "./database/exampleScenarios.js";

// Import & Export deps
import { importData } from "./database/progess/import.js";
import { exportData } from "./database/progess/export.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged; // for dev vs prod, should be changed later

let currentSession = null;

// IPC handlers
ipcMain.handle("register-user", async (event, payload = {}) => {
  try {
    const { username } = payload ?? {};
    if (!username) {
      throw new Error("Username missing");
    }
    console.log("Registering user:", {
      username
    });
    const user = registerUser(payload);
    currentSession = { userId: user.id, user };
    console.log("User registered successfully with ID:", user?.id);
    currentSession = { userId: user.id, user };
    return { success: true, user };
  } catch (error) {
    console.error("Error registering user:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("restore-session", async (event, payload = {}) => {
  try {
    const { id, username, role } = payload ?? {};
    if (!id) {
      throw new Error("User id is required to restore session.");
    }
    currentSession = { userId: id, user: { id, username, role } };
    return { success: true };
  } catch (error) {
    console.error("Error restoring session:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("sign-out", async () => {
  currentSession = null;
  return { success: true };
});

ipcMain.handle("login-user", async (event, payload = {}) => {
  try {
    const { username, password } = payload ?? {};
    if (!username || !password) {
      throw new Error("Username or Password missing");
    }
    const user = authenticateUser(username, password);
    currentSession = { userId: user.id, user } // Store current session on login so we cannot fake userIds
    return { success: true, user };
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, error: error.message };
  }
});

// Helper function to get userId linked to the login session
function getCurrentUserId() {
  if (!currentSession?.userId) {
    throw new Error("No user logged in");
  }
  return currentSession.userId;
}

function getCurrentUserRole() {
  const userId = getCurrentUserId();
  return getRoleById(userId)?.role;
}

function requireInstructor() {
  const role = getCurrentUserRole();
  if (role !== "admin" && role !== "instructor") {
    throw new Error("Instructor access required");
  }
}

// Scenario handlers
ipcMain.handle("get-all-scenarios", async () => {
  try {
    const scenarios = getAllScenarios();
    return { success: true, scenarios };
  } catch (error) {
    console.error("Error getting scenarios:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-scenario", async (event, scenarioId) => {
  try {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return { success: false, error: "Scenario not found" };
    }
    return { success: true, scenario };
  } catch (error) {
    console.error("Error getting scenario:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("create-scenario", async (event, payload = {}) => {
  try {
    const { name, definition } = payload ?? {};
    if (!name || !definition) {
      throw new Error("name and definition are required");
    }
    const scenarioId = createScenario(name, definition);
    return { success: true, scenarioId };
  } catch (error) {
    console.error("Error creating scenario:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("delete-scenario", async (event, scenarioId) => {
  try {
    if (!scenarioId) {
      throw new Error("scenarioId is required");
    }
    const deleted = deleteScenario(scenarioId);
    if (!deleted) {
      return { success: false, error: "Scenario not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting scenario:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("duplicate-scenario", async (event, scenarioId) => {
  try {
    if (!scenarioId) {
      throw new Error("scenarioId is required");
    }
    const newScenarioId = duplicateScenario(scenarioId);
    return { success: true, scenarioId: newScenarioId };
  } catch (error) {
    console.error("Error duplicating scenario:", error);
    return { success: false, error: error.message };
  }
});

// Quiz handlers
ipcMain.handle("get-all-quizzes", async () => {
  try {
    const userId = getCurrentUserId();
    const quizzes = getAllQuizzes(userId);
    return { success: true, quizzes };
  } catch (error) {
    console.error("Error getting quizzes:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("restore-session", async (event, payload = {}) => {
  try {
    const { userId } = payload ?? {};
    if (!userId) {
      throw new Error("userId is required");
    }
    const user = getUserById(userId);
    if (!user) {
      currentSession = null;
      return { success: false, error: "User not found" };
    }
    currentSession = {
      userId: user.id,
      user: { id: user.id, username: user.username, role: user.role },
    };
    return { success: true, user: currentSession.user };
  } catch (error) {
    console.error("Error restoring session:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-quiz", async (event, quizId) => {
  try {
    if (!quizId) {
      throw new Error("quizId is required");
    }
    const userId = getCurrentUserId();
    const quiz = getQuizById(quizId, userId);
    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }
    return { success: true, quiz };
  } catch (error) {
    console.error("Error getting quiz:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("create-quiz", async (event, payload = {}) => {
  try {
    requireInstructor();
    const userId = getCurrentUserId();
    const quizId = createQuiz({ ...payload, createdBy: userId });
    return { success: true, quizId };
  } catch (error) {
    console.error("Error creating quiz:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("update-quiz", async (event, payload = {}) => {
  try {
    requireInstructor();
    const { quizId, updates } = payload ?? {};
    if (!quizId) {
      throw new Error("quizId is required");
    }
    const updated = updateQuiz(quizId, updates);
    if (!updated) {
      return { success: false, error: "Quiz not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("Error updating quiz:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("delete-quiz", async (event, quizId) => {
  try {
    requireInstructor();
    if (!quizId) {
      throw new Error("quizId is required");
    }
    const deleted = deleteQuiz(quizId);
    if (!deleted) {
      return { success: false, error: "Quiz not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("copy-quiz", async (event, quizId) => {
  try {
    requireInstructor();
    if (!quizId) {
      throw new Error("quizId is required");
    }
    const userId = getCurrentUserId();
    const newQuizId = copyQuiz(quizId, userId);
    if (!newQuizId) {
      return { success: false, error: "Quiz not found" };
    }
    return { success: true, quizId: newQuizId };
  } catch (error) {
    console.error("Error copying quiz:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("submit-quiz", async (event, payload = {}) => {
  try {
    const userId = getCurrentUserId();
    const result = submitQuiz({ ...payload, userId });
    return { success: true, result };
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-user-quiz-submissions", async () => {
  try {
    const userId = getCurrentUserId();
    const submissions = getUserQuizSubmissions(userId);
    return { success: true, submissions };
  } catch (error) {
    console.error("Error getting quiz submissions:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-quiz-submission-details", async (event, { submissionId } = {}) => {
  try {
    if (!submissionId) {
      throw new Error("submissionId is required.");
    }
    const details = getSubmissionDetails(submissionId);
    if (!details) {
      throw new Error("Submission not found.");
    }
    return { success: true, details };
  } catch (error) {
    console.error("Error getting quiz submission details:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-all-users", async () => {
  try {
    requireInstructor();
    const users = getAllUsers().map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role ?? "student",
    }));
    return { success: true, users };
  } catch (error) {
    console.error("Error getting users:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("export-quiz", async (event, payload = {}) => {
  try {
    requireInstructor();
    const { quizId, filePath } = payload ?? {};
    if (!quizId || !filePath) {
      throw new Error("quizId and filePath are required");
    }
    const userId = getCurrentUserId();
    const quiz = getQuizById(quizId, userId);
    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }
    const exportPayload = {
      version: 1,
      quiz: {
        title: quiz.title,
        description: quiz.description,
        isPublic: quiz.isPublic ?? 1,
        showCorrectAnswers: quiz.showCorrectAnswers ?? 0,
        assignedStudentIds: quiz.assignedStudentIds ?? [],
        questions: quiz.questions.map((question) => ({
          prompt: question.prompt,
          type: question.type,
          options: question.options,
          correctAnswerIndex: question.correctAnswerIndex,
          explanation: question.explanation ?? null,
        })),
      },
    };
    await fs.writeFile(filePath, JSON.stringify(exportPayload, null, 2), "utf-8");
    return { success: true };
  } catch (error) {
    console.error("Error exporting quiz:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("import-quiz", async (event, payload = {}) => {
  try {
    requireInstructor();
    const { filePath } = payload ?? {};
    if (!filePath) {
      throw new Error("filePath is required");
    }
    const userId = getCurrentUserId();
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    const quizPayload = parsed?.quiz ?? parsed;
    if (!quizPayload?.title || !Array.isArray(quizPayload?.questions)) {
      throw new Error("Invalid quiz file");
    }
    const userRecords = getAllUsers();
    const studentIds = new Set(
      userRecords
        .filter((user) => (user.role ?? "student") === "student")
        .map((user) => Number(user.id))
    );
    const assignedStudentIds = Array.isArray(quizPayload.assignedStudentIds)
      ? quizPayload.assignedStudentIds.filter((id) => studentIds.has(Number(id)))
      : [];
    const quizId = createQuiz({
      title: quizPayload.title,
      description: quizPayload.description ?? "",
      createdBy: userId,
      questions: quizPayload.questions,
      isPublic: quizPayload.isPublic ?? true,
      showCorrectAnswers: quizPayload.showCorrectAnswers ?? false,
      assignedStudentIds,
    });
    return { success: true, quizId };
  } catch (error) {
    console.error("Error importing quiz:", error);
    return { success: false, error: error.message };
  }
});

// Simulation handlers
ipcMain.handle("start-sim", async (event, payload = {}) => {
  try {
    const { scenarioId, userId } = payload ?? {};
    if (!scenarioId || !userId) {
      throw new Error("scenarioId and userId are required");
    }
    const { sessionId, state } = startSession(scenarioId, userId);
    return { success: true, sessionId, state };
  } catch (error) {
    console.error("Error starting simulation:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-sim-state", async (event, payload = {}) => {
  try {
    const { sessionId } = payload ?? {};
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    const numericSessionId = typeof sessionId === "string" ? Number(sessionId) : sessionId;
    const state = getSessionState(numericSessionId);
    return { success: true, state };
  } catch (error) {
    console.error("Error getting simulation state:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("adjust-sim-medication", async (event, payload = {}) => {
  try {
    const { sessionId, medicationId, newDose } = payload ?? {};
    if (!sessionId || !medicationId || typeof newDose !== "number") {
      throw new Error(
        "sessionId, medicationId, and numeric newDose are required"
      );
    }
    const numericSessionId = typeof sessionId === "string" ? Number(sessionId) : sessionId;
    const state = adjustMedication(numericSessionId, medicationId, newDose);
    return { success: true, state };
  } catch (error) {
    console.error("Error adjusting medication:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("pause-sim", async (event, payload = {}) => {
  try {
    const { sessionId } = payload ?? {};
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    const numericSessionId = typeof sessionId === "string" ? Number(sessionId) : sessionId;
    const state = pauseSession(numericSessionId);
    return { success: true, state };
  } catch (error) {
    console.error("Error pausing simulation:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("resume-sim", async (event, payload = {}) => {
  try {
    const { sessionId } = payload ?? {};
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    const numericSessionId = typeof sessionId === "string" ? Number(sessionId) : sessionId;
    const state = resumeSession(numericSessionId);
    return { success: true, state };
  } catch (error) {
    console.error("Error resuming simulation:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("end-sim", async (event, payload = {}) => {
  try {
    const { sessionId } = payload ?? {};
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    const numericSessionId = typeof sessionId === "string" ? Number(sessionId) : sessionId;
    const state = endSession(numericSessionId, { reason: "user_end" });
    const summary = getSessionSummaryBySessionId(numericSessionId);
    return { success: true, state, summary };
  } catch (error) {
    console.error("Error ending simulation:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-session-summary", async (event, payload) => {
  try {
    const { sessionId } = payload ?? {};
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    const numericSessionId = typeof sessionId === "string" ? Number(sessionId) : sessionId;
    const summary = getSessionSummaryBySessionId(numericSessionId);
    return { success: true, summary: summary ?? null };
  } catch (error) {
    console.error("Error fetching session summary:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-session-summaries", async (event, payload) => {
  try {
    const { userId } = payload ?? {};
    if (!userId) {
      throw new Error("userId is required");
    }
    const summaries = getUserSessionSummaries(userId);
    return { success: true, summaries };
  } catch (error) {
    console.error("Error fetching session summaries:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("export-session-summary-pdf", async (event, payload = {}) => {
  try {
    return await exportSessionSummaryPdf(payload ?? {});
  } catch (error) {
    console.error("Error exporting summary PDF:", error);
    return { success: false, error: error.message };
  }
});

// Documentation handlers
ipcMain.handle("add-note", async (event, payload = {}) => {
  try {
    const { sessionId, userId, content, vitalsSnapshot } = payload ?? {};
    if (!sessionId || !userId || !content?.trim()) {
      throw new Error("sessionId, userId, and content are required");
    }
    const numericSessionId = typeof sessionId === "string" ? Number(sessionId) : sessionId;
    const session = getSession(numericSessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    const note = addSessionNote({
      sessionId: numericSessionId,
      userId,
      content,
      vitalsSnapshot: vitalsSnapshot ?? null,
    });
    return { success: true, note };
  } catch (error) {
    console.error("Error adding note:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-notes", async (event, payload = {}) => {
  try {
    const { sessionId } = payload ?? {};
    if (!sessionId) {
      throw new Error("sessionId is required");
    }
    const numericSessionId = typeof sessionId === "string" ? Number(sessionId) : sessionId;
    const notes = getSessionNotes(numericSessionId);
    return { success: true, notes };
  } catch (error) {
    console.error("Error fetching notes:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("delete-note", async (event, payload = {}) => {
  try {
    const { noteId, userId } = payload ?? {};
    if (!noteId) {
      throw new Error("noteId is required");
    }
    const note = deleteSessionNote({ noteId, userId });
    return { success: true, note };
  } catch (error) {
    console.error("Error deleting note:", error);
    return { success: false, error: error.message };
  }
});

// Import & Export handlers
ipcMain.handle("show-open-dialog", async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(options);
    return result;
  } catch (error) {
    console.error("Error showing open dialog:", error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(options);
    return result;
  } catch (error) {
    console.error("Error showing save dialog:", error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle("import-file", async (event, filePath) => {
  try {
    const importFilePath = importData(filePath);
    if (!importFilePath) {
      return { success: false, error: "Importing failed" };
    }
    return { success: true, filePath };
  } catch (error) {
    console.error("Error importing file:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("export-data", async (event, payload = {}) => {
  try {
    const { filePath, scenarioIds } = payload ?? {};
    if (!filePath || !scenarioIds) {
      throw new Error("filePath or scenarioIds missing");
    }
    const result = exportData(filePath, scenarioIds);
    return result;
  } catch (error) {
    console.error("Error exporting data:", error);
    return { success: false, error: error.message };
  }
});

// External URL handler (for Feedback form, etc.)
ipcMain.handle("open-external-url", async (event, url) => {
  try {
    if (!url || typeof url !== "string") {
      throw new Error("A valid URL string is required");
    }
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error("Error opening external URL:", error);
    return { success: false, error: error.message };
  }
});

export function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "build/index.html"));
  }
}

// Initialize database and create window when app is ready
app.whenReady().then(async () => {
  initDatabase();

  // Seed example scenarios in development mode
  if (isDev) {
    try {
      await seedExampleScenarios();
    } catch (error) {
      console.error("Error seeding example scenarios:", error);
    }
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
