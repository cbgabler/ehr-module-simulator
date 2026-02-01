# Database Versioning

This document describes how to manage database schema changes in the EHR Simulation application.

## Overview

The database schema is defined in `electron/database/database.js`. When you need to make schema changes, follow the guidelines below to ensure existing user data is preserved.

## Current Approach

The database uses `CREATE TABLE IF NOT EXISTS` statements, which means:

- Tables are created on first run
- Existing tables are not modified
- New tables can be added safely

## Making Schema Changes

### Adding a New Table

1. Add the `CREATE TABLE IF NOT EXISTS` statement to `initDatabase()` in `database.js`
2. The table will be created automatically on next app start
3. Existing data is unaffected

```javascript
// Example: Adding a new table
db.exec(`
  CREATE TABLE IF NOT EXISTS new_table (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );
`);
```

### Adding a Column to an Existing Table

SQLite has limited `ALTER TABLE` support. To add a column:

1. Use `ALTER TABLE ... ADD COLUMN` (SQLite supports this)
2. Wrap in a try-catch to handle cases where column already exists

```javascript
// Example: Adding a column safely
try {
  db.exec(`ALTER TABLE users ADD COLUMN email TEXT;`);
} catch (err) {
  // Column may already exist, ignore error
  if (!err.message.includes('duplicate column')) {
    throw err;
  }
}
```

### Modifying or Removing Columns

SQLite does not support `DROP COLUMN` or `MODIFY COLUMN` directly. To make these changes:

1. Create a new table with the desired schema
2. Copy data from the old table
3. Drop the old table
4. Rename the new table

```javascript
// Example: Removing a column (complex migration)
db.exec(`
  CREATE TABLE users_new (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'student'
    -- passwordHash column removed
  );
  
  INSERT INTO users_new (id, username, role)
  SELECT id, username, role FROM users;
  
  DROP TABLE users;
  
  ALTER TABLE users_new RENAME TO users;
`);
```

## Best Practices

1. **Always use `IF NOT EXISTS`** - Prevents errors on existing databases
2. **Test migrations locally** - Delete your local database and restart to test fresh installs
3. **Backup before major changes** - The database is at `{userData}/ehr_scenarios.db`
4. **Document changes** - Update `schema.md` when making schema changes
5. **Consider backwards compatibility** - New columns should have defaults or allow NULL

## Database Location

The database file location varies by platform:

| Platform | Path                                              |
| -------- | ------------------------------------------------- |
| macOS    | `~/Library/Application Support/ehr-electron/`     |
| Windows  | `%APPDATA%/ehr-electron/`                         |
| Linux    | `~/.config/ehr-electron/`                         |

## Debugging

To inspect the database directly:

```bash
# macOS
sqlite3 ~/Library/Application\ Support/ehr-electron/ehr_scenarios.db

# Common commands
.tables              # List all tables
.schema users        # Show table schema
SELECT * FROM users; # Query data
```

## Future: Migration System

For more complex versioning needs, consider implementing a migration system:

1. Track schema version in a `schema_version` table
2. Define migrations as numbered scripts
3. Run pending migrations on app start

See `electron/database/migrations.js` if a migration system has been implemented.
