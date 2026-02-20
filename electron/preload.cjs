const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script loaded");

// Expose API to frontend to interact with local DB
contextBridge.exposeInMainWorld("api", {
  message: () => "test",
  registerUser: async (userData) => {
    // commented out bc it contains password
    //console.log("registerUser called with:", userData);
    try {
      const result = await ipcRenderer.invoke("register-user", userData);
      console.log("IPC result:", result);
      return result;
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  loginUser: async (credentials) => {
    try {
      return await ipcRenderer.invoke("login-user", credentials);
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  getAllScenarios: async () => {
    try {
      return await ipcRenderer.invoke("get-all-scenarios");
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  getScenario: async (scenarioId) => {
    try {
      return await ipcRenderer.invoke("get-scenario", scenarioId);
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  createScenario: async ({ name, definition }) => {
    try {
      return await ipcRenderer.invoke("create-scenario", { name, definition });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  deleteScenario: async (scenarioId) => {
    try {
      return await ipcRenderer.invoke("delete-scenario", scenarioId);
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  duplicateScenario: async (scenarioId) => {
    try {
      return await ipcRenderer.invoke("duplicate-scenario", scenarioId);
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  getAllQuizzes: async () => {
    try {
      return await ipcRenderer.invoke("get-all-quizzes");
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  getQuiz: async (quizId) => {
    try {
      return await ipcRenderer.invoke("get-quiz", quizId);
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  createQuiz: async (payload) => {
    try {
      return await ipcRenderer.invoke("create-quiz", payload);
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  submitQuiz: async (payload) => {
    try {
      return await ipcRenderer.invoke("submit-quiz", payload);
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  // get user id from context rather than passing
  getUserQuizSubmissions: async () => {
    try {
      return await ipcRenderer.invoke("get-user-quiz-submissions");
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  startSimulation: async ({ scenarioId, userId }) => {
    try {
      return await ipcRenderer.invoke("start-sim", { scenarioId, userId });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  getSimulationState: async (sessionId) => {
    try {
      return await ipcRenderer.invoke("get-sim-state", { sessionId });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  adjustMedication: async ({ sessionId, medicationId, newDose }) => {
    try {
      return await ipcRenderer.invoke("adjust-sim-medication", {
        sessionId,
        medicationId,
        newDose,
      });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  pauseSimulation: async (sessionId) => {
    try {
      return await ipcRenderer.invoke("pause-sim", { sessionId });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  resumeSimulation: async (sessionId) => {
    try {
      return await ipcRenderer.invoke("resume-sim", { sessionId });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  endSimulation: async (sessionId) => {
    try {
      return await ipcRenderer.invoke("end-sim", { sessionId });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  getSessionSummary: async (sessionId) => {
    try {
      return await ipcRenderer.invoke("get-session-summary", { sessionId });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  getSessionSummaries: async (userId) => {
    try {
      return await ipcRenderer.invoke("get-session-summaries", { userId });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  addNote: async ({ sessionId, userId, content, vitalsSnapshot }) => {
    try {
      return await ipcRenderer.invoke("add-note", {
        sessionId,
        userId,
        content,
        vitalsSnapshot,
      });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  getNotes: async (sessionId) => {
    try {
      return await ipcRenderer.invoke("get-notes", { sessionId });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  deleteNote: async ({ noteId, userId }) => {
    try {
      return await ipcRenderer.invoke("delete-note", { noteId, userId });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  importFile: async (filePath) => {
    try {
      return ipcRenderer.invoke("import-file", filePath);
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  showOpenDialog: async (options) => {
    try {
      return await ipcRenderer.invoke("show-open-dialog", options);
    } catch (error) {
      console.error("IPC error:", error);
      return { canceled: true, error: error.message };
    }
  },
  showSaveDialog: async (options) => {
    try {
      return await ipcRenderer.invoke("show-save-dialog", options);
    } catch (error) {
      console.error("IPC error:", error);
      return { canceled: true, error: error.message };
    }
  },
  exportData: async ({ filePath, scenarioIds }) => {
    try {
      return await ipcRenderer.invoke("export-data", { filePath, scenarioIds });
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
  exportSessionSummaryPdf: async (payload) => {
    try {
      return await ipcRenderer.invoke("export-session-summary-pdf", payload);
    } catch (error) {
      console.error("IPC error:", error);
      return { success: false, error: error.message };
    }
  },
});

console.log("API exposed to window.api");
