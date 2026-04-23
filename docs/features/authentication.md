# Authentication & User Management

## Overview
The EHR Module Simulator uses a local authentication system with role-based access control. Users can sign in or register accounts directly within the app. Roles determine what actions are available — instructors can create/manage scenarios and quizzes, while students interact with simulations and take quizzes.

## Roles

| Role | Capabilities |
|---|---|
| **Student** | Start simulations, take quizzes, view session summaries, import/export scenarios |
| **Instructor** | Everything a student can do, plus: create/edit/delete/duplicate scenarios, create/edit/delete quizzes, assign quizzes to students |
| **Admin** | Same as instructor (reserved for future elevated permissions) |

## User Flow

### Sign In
1. Enter username and password on the Sign In page
2. Credentials are validated against the local SQLite database via `window.api.loginUser()`
3. On success, the user object is stored in React context (`AuthContext`) and persisted to `localStorage` for session restoration

### Register
1. Switch to "Create Account" mode on the Sign In page
2. Enter username, password (minimum 6 characters), confirm password, and select a role (Student or Instructor)
3. Account is created via `window.api.registerUser()` and the user is signed in automatically

### Session Persistence
- On app launch, `AuthContext` checks `localStorage` for a saved user
- If found, it calls `window.api.restoreSession()` to verify the user still exists in the database
- If the session is invalid or the user has been deleted, the stored data is cleared and the user is redirected to Sign In

### Sign Out
- Clicking "Sign Out" in the navigation bar triggers a confirmation modal
- On confirmation, the user state is cleared from both React context and `localStorage`
- The user is redirected to the Sign In page

## Protected Routes
All pages except Sign In are wrapped in a `ProtectedRoute` component that redirects unauthenticated users to `/sign-in`. The redirect preserves the original destination so the user returns to the correct page after signing in.

## Default Accounts

Two accounts are seeded automatically when the database is first created:

| Role | Username | Password |
|---|---|---|
| Instructor | `instructor1` | `password123` |
| Student | `student1` | `password123` |

## Architecture

| File | Responsibility |
|---|---|
| `frontend/src/pages/Auth/AuthContext.jsx` | React context provider managing `user` state, `signIn`, `register`, `signOut`, and session restoration |
| `frontend/src/pages/Auth/SignInPage.jsx` | Sign In / Register form UI with mode toggle and validation |
| `frontend/src/App.jsx` | `ProtectedRoute` and `LandingRoute` components for route guarding |
| `electron/database/models/users.js` | User database operations: create, authenticate, lookup |
| `electron/database/seedUsers.js` | Seeds default instructor and student accounts on first run |
| `electron/main.js` | IPC handlers: `login-user`, `register-user`, `restore-session`, `sign-out`, `get-all-users` |
| `electron/preload.cjs` | Exposes auth API methods on `window.api` |
