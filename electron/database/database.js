import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";
import { error } from "console";
import { runMigrations, getSchemaVersion, CURRENT_VERSION } from "./migrations.js";

const defaultDbPath = path.join(app.getPath("userData"), "ehr_scenarios.db");

let db;

/**
 * Initializes the database connection and runs any pending migrations.
 * @param {string} [dbPath] - Optional custom path to database file. Defaults to the main database path.
 * @param {boolean} [skipMigrations=false] - Skip running migrations (useful for export databases).
 * @returns {Database} The database instance.
 */
export function initDatabase(dbPath = defaultDbPath, skipMigrations = false) {
  db = new Database(dbPath);

  // Run migrations to create/update schema
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

/**
 * Gets the current schema version of the database.
 * @returns {number} The current schema version.
 */
export function getDatabaseVersion() {
  const database = getDb();
  return getSchemaVersion(database);
}

/**
 * Checks if the database schema is up to date.
 * @returns {boolean} True if the database is at the current version.
 */
export function isSchemaUpToDate() {
  return getDatabaseVersion() === CURRENT_VERSION;
}
