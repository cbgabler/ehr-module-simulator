import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";
import { error } from "console";
import { runMigrations, getSchemaVersion, CURRENT_VERSION } from "./migrations.js";

const defaultDbPath = path.join(app.getPath("userData"), "ehr_scenarios.db");

let db;

// Initializes the current database if it doesn't already exist
// @param {string} [dbPath] - Optional path to database file. Defaults to the main database path.
// @param {boolean} [skipMigrations=false] - Whether to skip running migrations
export function initDatabase(dbPath = defaultDbPath, skipMigrations = false) {
  db = new Database(dbPath);

  if (!skipMigrations) {
    runMigrations(db);
  }

  return db;
}

export function getDb() {
  if (!db) {
    throw new error("DB failed to initialize.");
  }
  return db;
}

export function getDatabaseVersion() {
  const database = getDb();
  return getSchemaVersion(database);
}

export function isSchemaUpToDate() {
  return getDatabaseVersion() === CURRENT_VERSION;
}
