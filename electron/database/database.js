import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";
import { error } from "console";
import { runMigrations, getSchemaVersion, CURRENT_VERSION } from "./migrations.js";

const defaultDbPath = path.join(app.getPath("userData"), "ehr_scenarios.db");

let db;

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
