import { app, BrowserWindow, dialog } from "electron";
import path from "path";
import { writeFile } from "fs/promises";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sanitizeFileSegment = (value) => {
  if (!value) {
    return "";
  }
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const formatDisplayTimestamp = (timestamp) => {
  if (!timestamp) {
    return "";
  }
  try {
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? String(timestamp) : parsed.toLocaleString();
  } catch {
    return String(timestamp);
  }
};

const buildSummaryHtml = ({
  summaryText,
  scenarioName,
  createdAt,
  sessionId,
  userName,
}) => {
  const escapedSummary = escapeHtml(summaryText || "");
  const escapedScenario = escapeHtml(scenarioName || "Unknown scenario");
  const escapedUser = escapeHtml(userName || "Unknown user");
  const escapedSession = escapeHtml(sessionId ?? "");
  const createdAtLabel = formatDisplayTimestamp(createdAt);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Session Summary</title>
    <style>
      body {
        font-family: "Helvetica Neue", Arial, sans-serif;
        padding: 32px;
        color: #0f172a;
      }
      h1 {
        margin: 0 0 8px 0;
        font-size: 24px;
      }
      .meta {
        margin-bottom: 16px;
        font-size: 14px;
        color: #475569;
      }
      .meta div {
        margin-bottom: 4px;
      }
      pre {
        white-space: pre-wrap;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        font-size: 13px;
        line-height: 1.6;
        color: #0f172a;
      }
    </style>
  </head>
  <body>
    <h1>Session Summary</h1>
    <div class="meta">
      <div><strong>Scenario:</strong> ${escapedScenario}</div>
      <div><strong>User:</strong> ${escapedUser}</div>
      ${escapedSession ? `<div><strong>Session:</strong> ${escapedSession}</div>` : ""}
      ${createdAtLabel ? `<div><strong>Generated:</strong> ${escapeHtml(createdAtLabel)}</div>` : ""}
    </div>
    <pre>${escapedSummary}</pre>
  </body>
</html>`;
};

export const exportSessionSummaryPdf = async ({
  summaryText,
  scenarioName,
  createdAt,
  sessionId,
  userName,
  fileName,
}) => {
  let pdfWindow = null;
  try {
    if (!summaryText || !String(summaryText).trim()) {
      throw new Error("summaryText is required");
    }

    const scenarioSegment = sanitizeFileSegment(scenarioName);
    const sessionSegment = sanitizeFileSegment(sessionId);
    const fallbackSegments = ["session-summary", scenarioSegment, sessionSegment]
      .filter(Boolean);
    const fallbackBase = fallbackSegments.length
      ? fallbackSegments.join("_")
      : "session-summary";

    const baseName = fileName ? path.basename(fileName) : "";
    const requestedBase = baseName.replace(/\.pdf$/i, "");
    const safeRequestedBase = sanitizeFileSegment(requestedBase);
    const finalBase = safeRequestedBase || fallbackBase;
    const suggestedName = `${finalBase}.pdf`;

    const saveResult = await dialog.showSaveDialog({
      title: "Save Session Summary",
      defaultPath: path.join(app.getPath("documents"), suggestedName),
      filters: [{ name: "PDF Files", extensions: ["pdf"] }],
    });

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true };
    }

    const html = buildSummaryHtml({
      summaryText,
      scenarioName,
      createdAt,
      sessionId,
      userName,
    });

    pdfWindow = new BrowserWindow({
      show: false,
      width: 900,
      height: 1200,
      backgroundColor: "#ffffff",
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
      },
    });

    await pdfWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );

    const pdfBuffer = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
    });

    await writeFile(saveResult.filePath, pdfBuffer);

    return { success: true, filePath: saveResult.filePath };
  } finally {
    if (pdfWindow) {
      pdfWindow.close();
    }
  }
};
