# Exporting Scenarios

This document describes how to export scenarios from the EHR Simulation application.

## Overview

Instructors can export scenarios to share with students or other instructors. Exported scenarios are saved as SQLite database files (`.db`), which preserves the data structure and is not easily readable as plain text.

## How to Export

1. Click the **Export** button on the Home page
2. Select the scenario(s) you want to export using the checkboxes
3. Click **Browse...** to choose a save location
4. Click **Export** to create the export file

## What Gets Exported

Each exported scenario includes:

- **Scenario data** - Name and definition (JSON configuration)
- **Scenario tabs** - Custom content tabs associated with the scenario
- **Scenario states** - Publication status and metadata

## Export File Format

Exported files are SQLite databases with the following tables:

```sql
-- users (empty, required for foreign key constraints)
CREATE TABLE users (...)

-- scenarios
CREATE TABLE scenarios (
  id INTEGER PRIMARY KEY,
  name TEXT,
  definition TEXT
)

-- scenario_tabs
CREATE TABLE scenario_tabs (
  id INTEGER PRIMARY KEY,
  scenarioId INTEGER,
  name TEXT,
  content TEXT,
  orderIndex INTEGER
)

-- scenario_states
CREATE TABLE scenario_states (
  id INTEGER PRIMARY KEY,
  scenarioId INTEGER,
  createdBy INTEGER,
  isPublished BOOLEAN,
  publishDate DATETIME
)
```

## Technical Details

### Export Location

The code is in `electron/database/progess/export.js`.

### Process

1. Opens the source database (user's local database)
2. Creates a new database file at the specified path
3. Queries selected scenarios and related data
4. Inserts data into the export database with new IDs
5. Closes both databases

### ID Mapping

When exporting, original scenario IDs are not preserved. New IDs are auto-generated in the export database to avoid conflicts when importing. Related records (tabs, states) are updated to reference the new IDs.

## Best Practices

1. **Use descriptive filenames** - Include scenario name or date
2. **Store exports safely** - Keep backups of important scenarios
3. **Share via secure channels** - Use LMS, email, or shared drives

## Troubleshooting

### "No scenarios found"

- Ensure you selected at least one scenario
- The selected scenario may have been deleted

### "Source database file does not exist"

- The application database hasn't been created yet
- Run the app normally first to initialize the database

### Export file already exists

- The export will overwrite the existing file
- Choose a different filename to preserve the old export
