import { app, BrowserWindow, ipcMain, dialog, session, Menu } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./database/database.js";

// Performance: Set application menu to null before app is ready
// This prevents Electron from creating a default menu, improving startup time
Menu.setApplicationMenu(null);

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

// Security: Validate IPC message senders to prevent untrusted frames from accessing APIs
// Reference: https://www.electronjs.org/docs/latest/tutorial/security#17-validate-the-sender-of-all-ipc-messages
function validateSender(frame) {
  // In development, allow localhost
  if (isDev) {
    const url = new URL(frame.url);
    return url.hostname === "localhost" && url.port === "5173";
  }
  // In production, only allow file:// protocol from our app
  return frame.url.startsWith("file://");
}

// IPC handlers with sender validation
// Security: All handlers validate the sender to prevent untrusted content from accessing APIs
ipcMain.handle("register-user", async (event, payload = {}) => {
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
  try {
    const { username, password } = payload ?? {};
    if (!username || !password) {
      throw new Error("Username or Password missing");
    }
    const user = authenticateUser(username, password);
    return { success: true, user };
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, error: error.message };
  }
});

// Scenario handlers
ipcMain.handle("get-all-scenarios", async (event) => {
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
  try {
    const scenarios = getAllScenarios();
    return { success: true, scenarios };
  } catch (error) {
    console.error("Error getting scenarios:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-scenario", async (event, scenarioId) => {
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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

// Simulation handlers
ipcMain.handle("start-sim", async (event, payload = {}) => {
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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

// Documentation handlers
ipcMain.handle("add-note", async (event, payload = {}) => {
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { canceled: true, error: "Unauthorized" };
  try {
    const result = await dialog.showOpenDialog(options);
    return result;
  } catch (error) {
    console.error("Error showing open dialog:", error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  if (!validateSender(event.senderFrame)) return { canceled: true, error: "Unauthorized" };
  try {
    const result = await dialog.showSaveDialog(options);
    return result;
  } catch (error) {
    console.error("Error showing save dialog:", error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle("import-file", async (event, filePath) => {
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
  if (!validateSender(event.senderFrame)) return { success: false, error: "Unauthorized" };
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
      contextIsolation: true,      // Security: Isolate preload script context
      nodeIntegration: false,      // Security: Disable Node.js in renderer
      sandbox: true,               // Security: Enable Chromium sandbox for renderer
      webSecurity: true,           // Security: Enforce same-origin policy (default)
      allowRunningInsecureContent: false,  // Security: Block insecure content
      experimentalFeatures: false, // Security: Disable experimental Chromium features
    },
  });

  // Security: Restrict navigation to prevent XSS attacks from redirecting to malicious sites
  // Reference: https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
  win.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // In dev, allow localhost navigation
    if (isDev && parsedUrl.hostname === "localhost" && parsedUrl.port === "5173") {
      return;
    }
    
    // In production, only allow file:// protocol
    if (!isDev && parsedUrl.protocol === "file:") {
      return;
    }
    
    // Block all other navigation
    event.preventDefault();
    console.warn("Blocked navigation to:", navigationUrl);
  });

  // Security: Prevent new window creation from renderer
  // Reference: https://www.electronjs.org/docs/latest/tutorial/security#14-disable-or-limit-creation-of-new-windows
  win.webContents.setWindowOpenHandler(({ url }) => {
    console.warn("Blocked new window creation for:", url);
    return { action: "deny" };
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "build/index.html"));
  }

  return win;
}

// Initialize database and create window when app is ready
app.whenReady().then(async () => {
  // Security: Set Content Security Policy (CSP) headers
  // Reference: https://www.electronjs.org/docs/latest/tutorial/security#7-define-a-content-security-policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          isDev
            ? // Development: Allow localhost for Vite HMR
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob:; " +
              "font-src 'self' data:; " +
              "connect-src 'self' ws://localhost:* http://localhost:*"
            : // Production: Strict CSP
              "default-src 'self'; " +
              "script-src 'self'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob:; " +
              "font-src 'self' data:; " +
              "connect-src 'self'"
        ],
      },
    });
  });

  // Security: Handle permission requests - deny all by default
  // Reference: https://www.electronjs.org/docs/latest/tutorial/security#5-handle-session-permission-requests-from-remote-content
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // This app doesn't need any special permissions (camera, mic, geolocation, etc.)
    // Deny all permission requests for security
    console.warn("Permission request denied:", permission);
    callback(false);
  });

  // Security: Verify webview options before creation (if webviews are used)
  // Reference: https://www.electronjs.org/docs/latest/tutorial/security#12-verify-webview-options-before-creation
  app.on("web-contents-created", (event, contents) => {
    contents.on("will-attach-webview", (event, webPreferences, params) => {
      // Strip away preload scripts if unused
      delete webPreferences.preload;
      // Disable Node.js integration
      webPreferences.nodeIntegration = false;
      webPreferences.contextIsolation = true;
      // Block all webviews by default - this app doesn't use them
      event.preventDefault();
      console.warn("Blocked webview creation");
    });
  });

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
