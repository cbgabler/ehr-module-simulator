const DEFAULT_NAME = "session-summary";

const sanitizeSegment = (value) => {
  if (!value) {
    return "";
  }
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
};

export const buildSummaryFileName = ({ scenarioName, sessionId }) => {
  const name = sanitizeSegment(scenarioName);
  const sessionPart = sanitizeSegment(sessionId);
  const segments = [DEFAULT_NAME, name, sessionPart].filter(Boolean);
  return `${segments.join("_")}.pdf`;
};
