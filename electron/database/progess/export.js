import { app } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

/* 
Export current scenario from local db for sharing to students

scenarioIds: array of scenario IDs to export (e.g., [1, 2, 3])
Exports scenarios along with their related scenario_tabs and scenario_states to a database file
*/
export function exportData(filePath, scenarioIds) {
  const sourceDbPath = path.join(app.getPath("userData"), "ehr_scenarios.db");

  if (!fs.existsSync(sourceDbPath)) {
    throw new Error("Source database file does not exist");
  }

  // Validate and sanitize scenarioIds - ensure they are all integers
  const validIds = scenarioIds
    .map((id) => parseInt(id, 10))
    .filter((id) => !isNaN(id) && id > 0);

  if (validIds.length === 0) {
    throw new Error("scenarioIds must contain valid positive integers");
  }

  // Convert to SQL IN clause format: (1, 2, 3)
  const scenarioIdsList = validIds.join(",");

  // Delete export file if it exists to avoid duplicates
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Open source database
  const sourceDb = new Database(sourceDbPath);

  // Create export database file directly (not using initDatabase to avoid shared connection)
  const exportDb = new Database(filePath);

  try {
    // Create tables in export database
    exportDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'instructor', 'admin')),
        passwordHash TEXT
      );

      CREATE TABLE IF NOT EXISTS scenarios (
        id INTEGER PRIMARY KEY,
        name TEXT, 
        definition TEXT
      );

      CREATE TABLE IF NOT EXISTS scenario_states (
        id INTEGER PRIMARY KEY,
        scenarioId INTEGER,
        createdBy INTEGER,
        isPublished BOOLEAN DEFAULT 0,
        publishDate DATETIME,
        FOREIGN KEY (scenarioId) REFERENCES scenarios(id) ON DELETE CASCADE,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS scenario_tabs (
        id INTEGER PRIMARY KEY,
        scenarioId INTEGER,
        name TEXT,
        content TEXT,
        orderIndex INTEGER,
        FOREIGN KEY (scenarioId) REFERENCES scenarios(id) ON DELETE CASCADE
      );
    `);

    // Get scenarios from source
    const scenarios = sourceDb
      .prepare(
        `SELECT id, name, definition FROM scenarios WHERE id IN (${scenarioIdsList})`
      )
      .all();

    if (scenarios.length === 0) {
      throw new Error("No scenarios found with the provided IDs");
    }

    // Get scenario IDs for related data
    const scenarioIdsForQuery = scenarios.map((s) => s.id).join(",");

    // Get scenario_tabs from source
    const scenarioTabs = sourceDb
      .prepare(
        `SELECT scenarioId, name, content, orderIndex
         FROM scenario_tabs
         WHERE scenarioId IN (${scenarioIdsForQuery})`
      )
      .all();

    // Get scenario_states from source
    const scenarioStates = sourceDb
      .prepare(
        `SELECT scenarioId, createdBy, isPublished, publishDate
         FROM scenario_states
         WHERE scenarioId IN (${scenarioIdsForQuery})`
      )
      .all();

    // Insert scenarios into export database (exclude id to get new auto-generated IDs)
    const insertScenario = exportDb.prepare(
      "INSERT INTO scenarios (name, definition) VALUES (?, ?)"
    );
    const idMap = new Map(); // oldId -> newId

    for (const scenario of scenarios) {
      const result = insertScenario.run(scenario.name, scenario.definition);
      idMap.set(scenario.id, result.lastInsertRowid);
    }

    // Insert scenario_tabs
    const insertTab = exportDb.prepare(
      "INSERT INTO scenario_tabs (scenarioId, name, content, orderIndex) VALUES (?, ?, ?, ?)"
    );

    for (const tab of scenarioTabs) {
      const newScenarioId = idMap.get(tab.scenarioId);
      if (newScenarioId) {
        insertTab.run(newScenarioId, tab.name, tab.content, tab.orderIndex);
      }
    }

    // Insert scenario_states
    const insertState = exportDb.prepare(
      "INSERT INTO scenario_states (scenarioId, createdBy, isPublished, publishDate) VALUES (?, ?, ?, ?)"
    );

    for (const state of scenarioStates) {
      const newScenarioId = idMap.get(state.scenarioId);
      if (newScenarioId) {
        insertState.run(
          newScenarioId,
          state.createdBy,
          state.isPublished,
          state.publishDate
        );
      }
    }

    return { success: true, filePath };
  } finally {
    sourceDb.close();
    exportDb.close();
  }
}
