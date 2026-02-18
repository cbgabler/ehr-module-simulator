# Importing Scenarios

This document describes how to import scenarios into the EHR Simulation application.

## Overview

Students and instructors can import scenarios that have been shared with them. This allows educators to distribute pre-built simulation scenarios to their classes.

## How to Import

1. Click the **Import** button on the Home page
2. Click **Browse...** to select the database file to import
3. Click **Import** to add the scenarios to your local database

## Supported File Types

- `.db` - SQLite database files
- `.sqlite` - SQLite database files
- `.sqlite3` - SQLite database files

## What Gets Imported

When you import a scenario file, the following data is added to your local database:

- **Scenarios** - Name and definition
- **Scenario tabs** - Custom content tabs
- **Scenario states** - Publication status

## Import Behavior

### Duplicate Handling

The import uses `INSERT OR IGNORE`, which means:

- Scenarios with matching name AND definition are skipped
- New scenarios are added with new IDs
- Existing scenarios are not overwritten

### ID Mapping

Imported scenarios receive new IDs in your local database. Related records (tabs, states) are matched by scenario name and definition to ensure proper relationships.

## Technical Details

### Import Location

The code is in `electron/database/progess/import.js`.

### Process

1. Validates the file path and extension
2. Attaches the import file as a secondary database
3. Inserts scenarios that don't already exist
4. Matches and inserts related tabs and states
5. Detaches the import database

### SQL Logic

```sql
-- Attach the import file
ATTACH DATABASE '/path/to/import.db' AS source;

-- Import scenarios (skip duplicates)
INSERT OR IGNORE INTO scenarios (name, definition)
SELECT name, definition FROM source.scenarios;

-- Import tabs (match by scenario name/definition)
INSERT OR IGNORE INTO scenario_tabs (scenarioId, name, content, orderIndex)
SELECT m.id, st.name, st.content, st.orderIndex
FROM source.scenario_tabs st
JOIN source.scenarios s ON st.scenarioId = s.id
JOIN scenarios m ON s.name = m.name AND s.definition = m.definition;

-- Import states
INSERT OR IGNORE INTO scenario_states (scenarioId, createdBy, isPublished, publishDate)
SELECT m.id, ss.createdBy, ss.isPublished, ss.publishDate
FROM source.scenario_states ss
JOIN source.scenarios s ON ss.scenarioId = s.id
JOIN scenarios m ON s.name = m.name AND s.definition = m.definition;
```

## Best Practices

1. **Verify the source** - Only import files from trusted sources
2. **Check after import** - Verify the scenarios appear correctly
3. **Keep original files** - Don't delete import files until verified

## Troubleshooting

### "File path does not exist"

- The selected file was moved or deleted
- Try selecting the file again

### "File path does not have the correct suffix"

- The file must end with `.db`, `.sqlite`, or `.sqlite3`
- Rename the file if it has a different extension

### Scenarios not appearing after import

- The scenarios may already exist (duplicates are skipped)
- Check if the import file contains valid scenario data
- Try refreshing the page or restarting the app

### "no such table" error

- The import file may be corrupted or from an incompatible version
- The file may not be a valid EHR export

## Security Considerations

- Import files are SQLite databases and could contain malicious SQL
- The application uses parameterized queries and ATTACH DATABASE to minimize risk
- Only import files from trusted sources
