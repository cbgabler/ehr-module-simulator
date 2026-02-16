# Duplicate Scenario Feature

## Overview
Instructors can now duplicate existing scenarios to quickly create variations without starting from scratch.

## User Flow

1. **Open Scenario Details**
   - Click on any scenario card to view details

2. **Duplicate Scenario** (Instructors only)
   - Click "Duplicate Scenario" button in modal footer
   - System creates copy instantly
   - Modal closes automatically
   - New scenario appears in grid with "(Copy)" in name

3. **Edit the Copy**
   - Find the duplicated scenario (it will be at the end of the list)
   - Open and modify as needed

## Implementation Details

### Backend (`electron/`)

**New Function: `duplicateScenario()`**
- Location: `electron/database/models/scenarios.js`
- Retrieves original scenario
- Creates new scenario with same definition
- Appends " (Copy)" to name
- Returns new scenario ID

**IPC Handler: `duplicate-scenario`**
- Location: `electron/main.js`
- Validates scenario ID
- Calls `duplicateScenario()`
- Returns success/error response

**Preload API**
- Location: `electron/preload.cjs`
- Exposes `window.api.duplicateScenario()`

### Frontend (`frontend/src/`)

**ScenarioDetailsModal Updates**
- Added "Duplicate Scenario" button for instructors
- Shows loading state while duplicating
- Displays error messages if duplication fails
- Button positioned before "Delete" button

**HomePage Updates**
- New state: `duplicatingScenarioId`, `duplicateError`
- New handler: `handleDuplicateScenario()`
- Refreshes scenario list after duplication
- Auto-closes modal on success

## Benefits

## Technical Notes

- **Zero Data Loss** - Original scenario untouched
- **Atomic Operation** - Either succeeds completely or fails cleanly
- **No Merge Conflicts** - Self-contained feature
- **Role-Based** - Only instructors/admins can duplicate

## Files Changed

**Created:**
- `docs/features/duplicate-scenario.md`

**Modified:**
- `electron/database/models/scenarios.js` - Added `duplicateScenario()` function
- `electron/main.js` - Added IPC handler
- `electron/preload.cjs` - Added API exposure
- `frontend/src/pages/Home/HomePage.jsx` - Added duplicate handler and state
- `frontend/src/pages/Home/components/ScenarioDetailsModal.jsx` - Added duplicate button

---

**Author:** Trey Springer (Frontend Team)  
**Date:** February 1st, 2026
**Sprint:** Sprint 2 of Winter Term
