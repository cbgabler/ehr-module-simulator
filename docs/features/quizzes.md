# Quizzes Feature

## Overview
The Quizzes module provides a complete assessment system that allows instructors to create, manage, and distribute quizzes to students. Students can take assigned quizzes, receive scores, and review their submission history. The feature supports role-based access, JSON import/export for quiz sharing, and configurable answer visibility.

## User Flows

### Instructor Flow
1. **Create a Quiz** — Click "Create Quiz" on the Quizzes page to open the form
2. **Add Questions** — Add multiple-choice or true/false questions with answer options, correct answer selection, and optional explanations
3. **Configure Visibility** — Set the quiz as public (visible to all students) or assign it to specific students
4. **Show Correct Answers** — Optionally allow students to see the correct answers after submission
5. **Manage Quizzes** — Edit, delete, copy, or export existing quizzes from the quiz grid
6. **Import Quizzes** — Import quizzes from JSON files shared by other instructors

### Student Flow
1. **Browse Quizzes** — View all public quizzes and quizzes assigned to you on the Quizzes page
2. **Take a Quiz** — Click a quiz card to open the quiz panel, answer all questions, and submit
3. **View Results** — See your score immediately after submission
4. **Review History** — View all past submissions in the "Quiz History" section at the bottom of the page

## Question Types

| Type | Description |
|---|---|
| Multiple Choice | 2+ custom answer options; one correct answer |
| True/False | Fixed "True" and "False" options; one correct answer |

Each question also supports:
- **Prompt** — The question text
- **Explanation** — Optional text explaining the correct answer (shown depending on quiz settings)

## Architecture

### Frontend

| File | Responsibility |
|---|---|
| `frontend/src/pages/Quizzes/QuizzesPage.jsx` | Page-level state management, quiz CRUD handlers, submission logic |
| `frontend/src/pages/Quizzes/components/QuizHeader.jsx` | Page heading, "Create Quiz" and "Import Quiz" buttons |
| `frontend/src/pages/Quizzes/components/QuizCreatePanel.jsx` | Quiz creation/editing form with question builder |
| `frontend/src/pages/Quizzes/components/QuizGrid.jsx` | Card grid displaying all available quizzes with action buttons (edit, delete, copy, export) |
| `frontend/src/pages/Quizzes/components/QuizTakePanel.jsx` | Quiz-taking interface with question display, answer selection, and submission |
| `frontend/src/pages/Quizzes/components/QuizHistory.jsx` | Past submission list with scores and timestamps |
| `frontend/src/pages/Quizzes/quizUtils.js` | Helper functions for creating empty questions and normalizing quiz data |

### Backend

| File | Responsibility |
|---|---|
| `electron/database/models/quizzes.js` | Database operations: create, read, update, delete, copy, import/export quizzes and submissions |
| `electron/main.js` | IPC handlers: `create-quiz`, `get-all-quizzes`, `get-quiz`, `update-quiz`, `delete-quiz`, `copy-quiz`, `submit-quiz`, `get-user-quiz-submissions`, `export-quiz`, `import-quiz` |
| `electron/preload.cjs` | Exposes quiz API methods on `window.api` |

## Data Model

### Quiz
- `id` — Auto-incrementing primary key
- `title` — Quiz display name
- `description` — Optional description text
- `createdBy` — User ID of the instructor who created the quiz
- `isPublic` — Boolean; if true, all students can see the quiz
- `showCorrectAnswers` — Boolean; if true, students see correct answers after submission
- `questions` — JSON array of question objects (stored as TEXT)
- `assignedStudentIds` — JSON array of student user IDs (stored as TEXT)

### Quiz Submission
- `id` — Auto-incrementing primary key
- `quizId` — Foreign key to the quiz
- `userId` — User who submitted
- `answers` — JSON array of answer objects
- `score` — Calculated score (number correct)
- `total` — Total number of questions

## Import/Export

Quizzes can be shared between app instances via JSON files:
- **Export**: Instructor selects a quiz → chooses a save location → quiz definition is written as a `.json` file
- **Import**: Instructor selects a `.json` file → quiz is validated and inserted into the local database with a new ID
