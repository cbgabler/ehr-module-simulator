# Database Schema

This document describes the database schema for the EHR Simulation application.

## Overview

The application uses SQLite (via `better-sqlite3`) for local data storage. The database file is located at:

```
{userData}/ehr_scenarios.db
```

Where `{userData}` is the Electron user data directory (platform-specific).

## Tables

### users

Stores user accounts and authentication information.

| Column       | Type    | Constraints                                              | Description                    |
| ------------ | ------- | -------------------------------------------------------- | ------------------------------ |
| id           | INTEGER | PRIMARY KEY                                              | Unique user identifier         |
| username     | TEXT    | UNIQUE NOT NULL                                          | Login username                 |
| role         | TEXT    | NOT NULL DEFAULT 'student', CHECK(student/instructor/admin) | User role                      |
| passwordHash | TEXT    |                                                          | Hashed password                |

### scenarios

Stores simulation scenario definitions.

| Column     | Type    | Constraints | Description                          |
| ---------- | ------- | ----------- | ------------------------------------ |
| id         | INTEGER | PRIMARY KEY | Unique scenario identifier           |
| name       | TEXT    |             | Scenario display name                |
| definition | TEXT    |             | JSON string with scenario definition |

### scenario_states

Tracks publication state of scenarios.

| Column      | Type     | Constraints                          | Description                      |
| ----------- | -------- | ------------------------------------ | -------------------------------- |
| id          | INTEGER  | PRIMARY KEY                          | Unique state identifier          |
| scenarioId  | INTEGER  | FK -> scenarios(id) ON DELETE CASCADE | Associated scenario              |
| createdBy   | INTEGER  | FK -> users(id) ON DELETE CASCADE    | User who created/modified        |
| isPublished | BOOLEAN  | DEFAULT 0                            | Whether scenario is published    |
| publishDate | DATETIME |                                      | When scenario was published      |

### scenario_tabs

Stores custom tabs/content for scenarios.

| Column     | Type    | Constraints                          | Description              |
| ---------- | ------- | ------------------------------------ | ------------------------ |
| id         | INTEGER | PRIMARY KEY                          | Unique tab identifier    |
| scenarioId | INTEGER | FK -> scenarios(id) ON DELETE CASCADE | Associated scenario      |
| name       | TEXT    |                                      | Tab display name         |
| content    | TEXT    |                                      | Tab content (HTML/text)  |
| orderIndex | INTEGER |                                      | Display order            |

### sessions

Stores simulation session data.

| Column     | Type     | Constraints                          | Description               |
| ---------- | -------- | ------------------------------------ | ------------------------- |
| id         | INTEGER  | PRIMARY KEY                          | Unique session identifier |
| scenarioId | INTEGER  | FK -> scenarios(id) ON DELETE CASCADE | Scenario being run        |
| userId     | INTEGER  | FK -> users(id) ON DELETE CASCADE    | User running session      |
| started    | DATETIME |                                      | Session start time        |
| ended      | DATETIME |                                      | Session end time          |

### notes

Stores notes taken during simulation sessions.

| Column         | Type     | Constraints                          | Description                     |
| -------------- | -------- | ------------------------------------ | ------------------------------- |
| id             | INTEGER  | PRIMARY KEY                          | Unique note identifier          |
| sessionId      | INTEGER  | FK -> sessions(id) ON DELETE CASCADE | Associated session              |
| userId         | INTEGER  | FK -> users(id) ON DELETE CASCADE    | User who created note           |
| content        | TEXT     |                                      | Note content                    |
| vitalsSnapshot | TEXT     |                                      | JSON snapshot of vitals at time |
| createdAt      | DATETIME |                                      | When note was created           |

### session_actions

Logs actions taken during simulation sessions.

| Column      | Type     | Constraints                          | Description                      |
| ----------- | -------- | ------------------------------------ | -------------------------------- |
| id          | INTEGER  | PRIMARY KEY                          | Unique action identifier         |
| sessionId   | INTEGER  | FK -> sessions(id) ON DELETE CASCADE | Associated session               |
| userId      | INTEGER  | FK -> users(id) ON DELETE CASCADE    | User who performed action        |
| actionType  | TEXT     | NOT NULL                             | Type of action (e.g., medication)|
| actionLabel | TEXT     | NOT NULL                             | Human-readable action label      |
| details     | TEXT     |                                      | JSON with additional details     |
| createdAt   | DATETIME |                                      | When action was performed        |

### session_summaries

Stores AI-generated or user-created session summaries.

| Column     | Type     | Constraints                           | Description                |
| ---------- | -------- | ------------------------------------- | -------------------------- |
| id         | INTEGER  | PRIMARY KEY                           | Unique summary identifier  |
| sessionId  | INTEGER  | FK -> sessions(id) ON DELETE CASCADE  | Associated session         |
| userId     | INTEGER  | FK -> users(id) ON DELETE CASCADE     | User who owns summary      |
| scenarioId | INTEGER  | FK -> scenarios(id) ON DELETE CASCADE | Associated scenario        |
| summary    | TEXT     |                                       | Summary content            |
| createdAt  | DATETIME |                                       | When summary was created   |

## Entity Relationships

```
users
  ├── scenario_states (createdBy)
  ├── sessions (userId)
  ├── notes (userId)
  ├── session_actions (userId)
  └── session_summaries (userId)

scenarios
  ├── scenario_states (scenarioId)
  ├── scenario_tabs (scenarioId)
  ├── sessions (scenarioId)
  └── session_summaries (scenarioId)

sessions
  ├── notes (sessionId)
  ├── session_actions (sessionId)
  └── session_summaries (sessionId)
```

## Cascade Deletes

All foreign key relationships use `ON DELETE CASCADE`, meaning:

- Deleting a **user** removes their sessions, notes, actions, and summaries
- Deleting a **scenario** removes its tabs, states, sessions, and related data
- Deleting a **session** removes its notes, actions, and summaries
