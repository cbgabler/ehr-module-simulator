import { getDb } from "../database.js";
import { logSessionAction } from "./sessionLogs.js";

const NOTE_PREVIEW_LIMIT = 140;

function buildNotePreview(content) {
  const sanitized = (content ?? "").trim().replace(/\s+/g, " ");
  if (!sanitized) {
    return "";
  }
  if (sanitized.length <= NOTE_PREVIEW_LIMIT) {
    return sanitized;
  }
  return `${sanitized.slice(0, NOTE_PREVIEW_LIMIT - 3)}...`;
}

export function addSessionNote({
  sessionId,
  userId,
  content,
  vitalsSnapshot = null,
}) {
  const db = getDb();
  const sanitizedContent = (content ?? "").trim();
  if (!sanitizedContent) {
    throw new Error("Note content is required");
  }

  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO notes (sessionId, userId, content, vitalsSnapshot, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    sessionId,
    userId,
    sanitizedContent,
    vitalsSnapshot ? JSON.stringify(vitalsSnapshot) : null,
    createdAt
  );

  const note = {
    id: info.lastInsertRowid,
    sessionId,
    userId,
    content: sanitizedContent,
    createdAt,
    vitalsSnapshot,
  };

  const preview = buildNotePreview(sanitizedContent);
  logSessionAction({
    sessionId,
    userId,
    actionType: "note_added",
    actionLabel: preview ? `Added note: ${preview}` : "Added note",
    details: {
      noteId: note.id,
      preview: preview || null,
    },
  });

  return note;
}

export function getSessionNotes(sessionId) {
  const db = getDb();
  const rows = db
    .prepare(
      `
    SELECT id, sessionId, userId, content, vitalsSnapshot, createdAt
    FROM notes
    WHERE sessionId = ?
    ORDER BY datetime(createdAt) ASC, id ASC
  `
    )
    .all(sessionId);

  return rows.map((row) => ({
    ...row,
    vitalsSnapshot: row.vitalsSnapshot
      ? JSON.parse(row.vitalsSnapshot)
      : null,
  }));
}

export function deleteSessionNote({ noteId, userId }) {
  const db = getDb();
  const note = db
    .prepare("SELECT * FROM notes WHERE id = ?")
    .get(noteId);
  if (!note) {
    throw new Error("Note not found");
  }
  if (userId && note.userId !== userId) {
    throw new Error("You do not have permission to delete this note");
  }
  db.prepare("DELETE FROM notes WHERE id = ?").run(noteId);
  const deletedNote = {
    ...note,
    vitalsSnapshot: note.vitalsSnapshot
      ? JSON.parse(note.vitalsSnapshot)
      : null,
  };

  const preview = buildNotePreview(note.content);
  logSessionAction({
    sessionId: note.sessionId,
    userId: note.userId,
    actionType: "note_deleted",
    actionLabel: preview ? `Deleted note: ${preview}` : "Deleted note",
    details: {
      noteId,
      preview: preview || null,
    },
  });

  return deletedNote;
}
