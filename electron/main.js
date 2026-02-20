import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./database/database.js";
import { exportSessionSummaryPdf } from "./utils/summaryExport.js";

// Users
import { 
  authenticateUser, 
  registerUser 
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
    const username = payload ?? {};
    if (!username) {
      throw new Error("Username missing");
    }
    console.log("Registering user:", {
      username
    });
    const user = registerUser(payload);
    console.log("User registered successfully with ID:", user?.id);
    return { success: true, user };
  } catch (error) {
    console.error("Error registering user:", error);
    return { success: false, error: error.message };
  }
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
    const quizzes = getAllQuizzes();
    return { success: true, quizzes };
  } catch (error) {
    console.error("Error getting quizzes:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-quiz", async (event, quizId) => {
  try {
    if (!quizId) {
      throw new Error("quizId is required");
    }
    const quiz = getQuizById(quizId);
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
    const quizId = createQuiz(payload);
    return { success: true, quizId };
  } catch (error) {
    console.error("Error creating quiz:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("submit-quiz", async (event, payload = {}) => {
  try {
    const result = submitQuiz(payload);
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
