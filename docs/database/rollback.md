# Database Rollback

This document describes how to rollback database changes if something goes wrong.

## Overview

SQLite databases are single files, making backup and restore straightforward. The database is located at:

```
{userData}/ehr_scenarios.db
```

## Backup Strategies

### Manual Backup

Before making significant changes, create a backup:

```bash
# macOS
cp ~/Library/Application\ Support/ehr-electron/ehr_scenarios.db ~/Desktop/ehr_backup.db

# Windows (PowerShell)
Copy-Item "$env:APPDATA/ehr-electron/ehr_scenarios.db" "$env:USERPROFILE/Desktop/ehr_backup.db"

# Linux
cp ~/.config/ehr-electron/ehr_scenarios.db ~/ehr_backup.db
```

### Restore from Backup

To restore a backup:

1. Close the application completely
2. Replace the database file with your backup
3. Restart the application

```bash
# macOS
cp ~/Desktop/ehr_backup.db ~/Library/Application\ Support/ehr-electron/ehr_scenarios.db
```

## Rollback Scenarios

### Corrupt Database

If the database becomes corrupt:

1. **Try to recover data** using SQLite's `.recover` command:
   ```bash
   sqlite3 ehr_scenarios.db ".recover" | sqlite3 recovered.db
   ```

2. **Restore from backup** if recovery fails

3. **Start fresh** by deleting the database file (app will create a new one)

### Bad Migration

If a schema change causes issues:

1. **Restore from backup** taken before the change

2. **Fix the migration code** before restarting the app

3. **Delete and recreate** if no backup exists:
   ```bash
   # WARNING: This deletes all data
   rm ~/Library/Application\ Support/ehr-electron/ehr_scenarios.db
   ```

### Data Corruption from Bug

If application code corrupted data:

1. **Restore from backup** if available

2. **Fix specific records** using SQLite directly:
   ```bash
   sqlite3 ehr_scenarios.db
   UPDATE users SET role = 'student' WHERE role = 'invalid';
   DELETE FROM sessions WHERE started IS NULL;
   ```

## Reset to Clean State

To completely reset the database (loses all data):

1. Close the application
2. Delete the database file
3. Restart the application

```bash
# macOS
rm ~/Library/Application\ Support/ehr-electron/ehr_scenarios.db

# Windows (PowerShell)
Remove-Item "$env:APPDATA/ehr-electron/ehr_scenarios.db"

# Linux
rm ~/.config/ehr-electron/ehr_scenarios.db
```

The application will create a fresh database with the current schema on next start.
