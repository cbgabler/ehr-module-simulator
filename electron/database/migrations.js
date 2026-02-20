/*
Database Migration System

Each migration has a version number and an `up` function that applies the migration.
Migrations are run in order when the database is initialized.
The current version is tracked in the `schema_version` table.

To add a new migration:
1. Add a new object to the `migrations` array with the next version number
2. Implement the `up` function with the SQL changes
3. The migration will run automatically on next app start
*/

export const CURRENT_VERSION = 3;

export const migrations = [
  {
    version: 1,
    description: "Initial schema",
    up: (db) => {
      db.exec(`
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

        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY,
          scenarioId INTEGER,
          userId INTEGER,
          started DATETIME,
          ended DATETIME,
          FOREIGN KEY (scenarioId) REFERENCES scenarios(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY,
          sessionId INTEGER,
          userId INTEGER,
          content TEXT,
          vitalsSnapshot TEXT,
          createdAt DATETIME,
          FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
    },
  },

  {
    version: 2,
    description: "Add session_actions and session_summaries tables",
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS session_actions (
          id INTEGER PRIMARY KEY,
          sessionId INTEGER,
          userId INTEGER,
          actionType TEXT NOT NULL,
          actionLabel TEXT NOT NULL,
          details TEXT,
          createdAt DATETIME,
          FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS session_summaries (
          id INTEGER PRIMARY KEY,
          sessionId INTEGER,
          userId INTEGER,
          scenarioId INTEGER,
          summary TEXT,
          createdAt DATETIME,
          FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (scenarioId) REFERENCES scenarios(id) ON DELETE CASCADE
        );
      `);
    },
  },
  {
    version: 3,
    description: "Add quizzes tables",
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS quizzes (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          createdBy INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS quiz_questions (
          id INTEGER PRIMARY KEY,
          quizId INTEGER NOT NULL,
          prompt TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('true_false', 'multiple_choice')),
          options TEXT NOT NULL,
          correctAnswerIndex INTEGER NOT NULL,
          orderIndex INTEGER NOT NULL,
          FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_submissions (
          id INTEGER PRIMARY KEY,
          quizId INTEGER NOT NULL,
          userId INTEGER NOT NULL,
          score INTEGER NOT NULL,
          total INTEGER NOT NULL,
          submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_submission_answers (
          id INTEGER PRIMARY KEY,
          submissionId INTEGER NOT NULL,
          questionId INTEGER NOT NULL,
          selectedAnswerIndex INTEGER,
          isCorrect BOOLEAN NOT NULL DEFAULT 0,
          FOREIGN KEY (submissionId) REFERENCES quiz_submissions(id) ON DELETE CASCADE,
          FOREIGN KEY (questionId) REFERENCES quiz_questions(id) ON DELETE CASCADE
        );
      `);
    },
  },

  // Example: Add a new migration when schema changes
  // {
  //   version: 2,
  //   description: "Add email field to users",
  //   up: (db) => {
  //     db.exec(`ALTER TABLE users ADD COLUMN email TEXT;`);
  //   },
  // },
];

/**
 * Runs all pending migrations on the database
 * @param {Database} db - The better-sqlite3 database instance
 */
export function runMigrations(db) {
  // Create schema_version table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Get current version
  let row = db.prepare("SELECT version FROM schema_version WHERE id = 1").get();
  let currentVersion = row ? row.version : 0;

  // If no version record exists, insert one
  if (!row) {
    db.prepare("INSERT INTO schema_version (id, version) VALUES (1, 0)").run();
  }

  // Run pending migrations
  const pendingMigrations = migrations.filter((m) => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    console.log(`Database is up to date (version ${currentVersion})`);
    return;
  }

  console.log(
    `Running ${pendingMigrations.length} migration(s) from version ${currentVersion} to ${CURRENT_VERSION}`
  );

  for (const migration of pendingMigrations) {
    console.log(`Running migration ${migration.version}: ${migration.description}`);

    // Run migration in a transaction
    const runMigration = db.transaction(() => {
      migration.up(db);
      db.prepare(
        "UPDATE schema_version SET version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
      ).run(migration.version);
    });

    try {
      runMigration();
      console.log(`Migration ${migration.version} complete`);
    } catch (err) {
      console.error(`Migration ${migration.version} failed:`, err);
      throw err;
    }
  }

  console.log(`Database migrated to version ${CURRENT_VERSION}`);
}

/**
 * Gets the current database schema version
 * @param {Database} db - The better-sqlite3 database instance
 * @returns {number} The current schema version
 */
export function getSchemaVersion(db) {
  try {
    const row = db.prepare("SELECT version FROM schema_version WHERE id = 1").get();
    return row ? row.version : 0;
  } catch {
    return 0;
  }
}
