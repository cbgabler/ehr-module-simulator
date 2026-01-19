import { getDb } from "../database.js";

export function logSessionAction({
  sessionId,
  userId,
  actionType,
  actionLabel,
  details = null,
}) {
  if (!sessionId || !userId || !actionType || !actionLabel) {
    throw new Error("sessionId, userId, actionType, and actionLabel are required");
  }
  const db = getDb();
  const createdAt = new Date().toISOString();
  const info = db
    .prepare(
      `
      INSERT INTO session_actions (sessionId, userId, actionType, actionLabel, details, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      sessionId,
      userId,
      actionType,
      actionLabel,
      details ? JSON.stringify(details) : null,
      createdAt
    );

  return {
    id: info.lastInsertRowid,
    sessionId,
    userId,
    actionType,
    actionLabel,
    details,
    createdAt,
  };
}

export function getSessionActions(sessionId) {
  if (!sessionId) {
    throw new Error("sessionId is required");
  }
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT id, sessionId, userId, actionType, actionLabel, details, createdAt
      FROM session_actions
      WHERE sessionId = ?
      ORDER BY datetime(createdAt) ASC, id ASC
    `
    )
    .all(sessionId);

  return rows.map((row) => ({
    ...row,
    details: row.details ? JSON.parse(row.details) : null,
  }));
}

export function getSessionSummaryBySessionId(sessionId) {
  if (!sessionId) {
    throw new Error("sessionId is required");
  }
  const db = getDb();
  return db
    .prepare(
      `
      SELECT id, sessionId, userId, scenarioId, summary, createdAt
      FROM session_summaries
      WHERE sessionId = ?
      ORDER BY datetime(createdAt) DESC, id DESC
      LIMIT 1
    `
    )
    .get(sessionId);
}

export function getUserSessionSummaries(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }
  const db = getDb();
  return db
    .prepare(
      `
      SELECT
        ss.id,
        ss.sessionId,
        ss.userId,
        ss.scenarioId,
        ss.summary,
        ss.createdAt,
        s.name AS scenarioName
      FROM session_summaries ss
      LEFT JOIN scenarios s ON s.id = ss.scenarioId
      WHERE ss.userId = ?
      ORDER BY datetime(ss.createdAt) DESC, ss.id DESC
    `
    )
    .all(userId);
}

export function createSessionSummary({
  sessionId,
  userId,
  scenarioId,
  summary,
  createdAt = null,
}) {
  if (!sessionId || !userId || !scenarioId || !summary) {
    throw new Error("sessionId, userId, scenarioId, and summary are required");
  }
  const db = getDb();
  const timestamp = createdAt || new Date().toISOString();
  const info = db
    .prepare(
      `
      INSERT INTO session_summaries (sessionId, userId, scenarioId, summary, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(sessionId, userId, scenarioId, summary, timestamp);

  return {
    id: info.lastInsertRowid,
    sessionId,
    userId,
    scenarioId,
    summary,
    createdAt: timestamp,
  };
}
