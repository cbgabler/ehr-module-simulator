import { initDatabase } from "../database.js";
import { app } from "electron";
import fs from "fs";
import path from "path";

/* 
Import custom scenarios created by educators

filePath: path to the database file to import from
Imports scenarios along with their related scenario_tabs and scenario_states
Must be changed to uphold any schema changes (scenario_tabs/states... etc.)
*/
export function importData(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error("File path does not exist");
  }

  if (
    !filePath.endsWith(".db") &&
    !filePath.endsWith(".sqlite") &&
    !filePath.endsWith(".sqlite3")
  ) {
    throw new Error("File path does not have the correct suffix");
  }

  const mainDb = initDatabase();
  const normalizedPath = path.resolve(filePath).replace(/'/g, "''");

  mainDb.exec(`ATTACH DATABASE '${normalizedPath}' AS source;`);

  const temp = mainDb.exec(`
    INSERT OR IGNORE INTO scenarios (name, definition)
    SELECT name, definition FROM source.scenarios;
    
    INSERT OR IGNORE INTO scenario_tabs (scenarioId, name, content, orderIndex)
    SELECT m.id, st.name, st.content, st.orderIndex
    FROM source.scenario_tabs st
    JOIN source.scenarios s ON st.scenarioId = s.id
    JOIN scenarios m ON s.name = m.name AND s.definition = m.definition;
    
    INSERT OR IGNORE INTO scenario_states (scenarioId, createdBy, isPublished, publishDate)
    SELECT m.id, ss.createdBy, ss.isPublished, ss.publishDate
    FROM source.scenario_states ss
    JOIN source.scenarios s ON ss.scenarioId = s.id
    JOIN scenarios m ON s.name = m.name AND s.definition = m.definition;
  `);
  console.log(temp);

  return { success: true, filePath };
}
