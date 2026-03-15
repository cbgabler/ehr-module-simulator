# Scenario Authoring Feature

## Overview
Instructors and admins can create custom simulation scenarios directly within the app using a multi-section form. Each scenario fully configures the patient context, initial vital signs, medications, provider orders, simulation parameters, and optional custom documentation tabs that students interact with during a session.

## Access
The **Create Scenario** button appears on the Home page only for users with the `instructor` or `admin` role. Students do not see it.

## User Flow

1. **Open the modal**
   - Click **Create Scenario** on the Home page

2. **Fill out each section** (described below)

3. **Submit**
   - Click **Create Scenario** in the modal footer
   - On success the modal closes and the scenario grid refreshes automatically
   - On validation error a message appears at the bottom of the form

## Form Sections

### Scenario Name
- Required free-text field
- Used as the display title on scenario cards and in session summaries

### Patient Information
| Field | Required | Notes |
|---|---|---|
| Patient Name | Yes | |
| Age | Yes | |
| Gender | Yes | Male / Female / Other |
| MRN | No | Auto-generated as `MRN-<timestamp>` if left blank |
| Primary Diagnosis | Yes | Also used as the default tag if no tags are added |
| Room | No | |
| Attending Physician | No | |
| Allergies | No | Dynamic list — each entry has substance, reaction, and severity (Mild / Moderate / Severe) |

### Vital Signs
Sets the simulation's **initial state**. All values are numbers. Required fields are marked below.

| Vital | Required | Default |
|---|---|---|
| Systolic BP (mmHg) | Yes | — |
| Diastolic BP (mmHg) | Yes | — |
| Heart Rate (bpm) | Yes | — |
| Respiratory Rate (breaths/min) | Yes | — |
| Temperature (°F) | No | 98.6 |
| O2 Saturation (%) | No | 98 |
| Pain Level (0–10) | No | 0 |
| Weight (lbs) | No | 150 |

### Medications
Dynamic list of medications the patient is on. At least one medication with a name and dosage is required.

| Field | Notes |
|---|---|
| Name | Medication name |
| Dose | Current dose value |
| Route | PO / IV / IM / SubQ / Topical |
| Frequency | Free text (e.g., "Q4H PRN") |
| Indication | Free text |
| PRN | Checkbox |

> **Titration** — every medication is created with a titration range (`min: 1`, `max: 100`, `step: 1`, `unit: mg` by default). If the simulation's medication effects are configured, students can adjust the dose within this range during a session from the Medication Administration tab.

### Provider Orders
Optional dynamic list of orders displayed in the Provider Orders tab during simulation. Orders do not affect the simulation engine — they are documentation only.

| Field | Options |
|---|---|
| Type | Medication / Vital Signs / Activity / Diet / Lab / Other |
| Description | Free text |
| Status | Active / Pending / Completed |
| Priority | Routine / Stat / Urgent |

### Learning Objectives
Optional dynamic list of free-text objectives. Displayed in the scenario details modal on the Home page so students know what they should focus on before starting.

### Tags
Optional dynamic list of short labels used by the search and filter system on the Home page. If no tags are added, the primary diagnosis is used as the default tag.

### Simulation Parameters
Controls how the simulation engine behaves. These fields directly affect runtime behavior.

| Field | Default | Description |
|---|---|---|
| Tick Interval (ms) | 5000 | How often the simulation engine updates vitals. Lower = faster simulation. Range: 1000–60,000 ms. |
| Target Systolic BP | — | Optional. If set alongside Target Diastolic, the session auto-completes when vitals reach these targets. |
| Target Diastolic BP | — | Optional. Must be set together with Target Systolic. |
| Hold Ticks Required | 3 | Only shown when both BP targets are set. Number of consecutive ticks vitals must stay within the target range before the session auto-completes. |

### Metadata
| Field | Default | Notes |
|---|---|---|
| Difficulty | Intermediate | Beginner / Intermediate / Advanced — used by the difficulty filter on Home page |
| Estimated Duration | "30-45 minutes" | Free text — informational only |
| Specialty | "General Nursing" | Free text — used by the specialty filter on Home page |

### Custom Tabs
Optional instructor-defined tabs that appear during a simulation alongside the four standard tabs (Vital Signs, Medications, Provider Orders, Data Assessment).

- Add one or more tabs, each with a **label** (the tab name) and any number of **fields**
- Each field has: label, type (Text / Number / Text Area), optional placeholder, and optional unit
- Students can fill in these fields freely during a session — the values are **not** used by the simulation engine; they serve as a structured documentation workspace

## Implementation Details

### Frontend

| File | Responsibility |
|---|---|
| `frontend/src/pages/Home/HomePage.jsx` | Renders "Create Scenario" button for instructors/admins; controls modal visibility; calls `loadScenarios()` on success |
| `frontend/src/pages/Home/components/CreateScenarioModal.jsx` | Owns all form state; runs validation; assembles the full `scenarioDefinition` object; calls `window.api.createScenario()` |
| `frontend/src/pages/Home/components/forms/PatientInfoForm.jsx` | Patient demographics and allergies |
| `frontend/src/pages/Home/components/forms/VitalsForm.jsx` | Initial vital sign inputs |
| `frontend/src/pages/Home/components/forms/MedicationsForm.jsx` | Dynamic medication list |
| `frontend/src/pages/Home/components/forms/OrdersForm.jsx` | Dynamic provider orders |
| `frontend/src/pages/Home/components/forms/LearningObjectivesForm.jsx` | Dynamic learning objectives |
| `frontend/src/pages/Home/components/forms/TagsForm.jsx` | Dynamic tags |
| `frontend/src/pages/Home/components/forms/SimulationParamsForm.jsx` | Tick interval, BP targets, hold ticks |
| `frontend/src/pages/Home/components/forms/MetadataForm.jsx` | Difficulty, duration, specialty |
| `frontend/src/pages/Home/components/forms/CustomTabsForm.jsx` | Custom tab and field builder |

### Backend

**IPC Handler:** `create-scenario` in `electron/main.js`
- Requires an authenticated session (any role)
- Calls `createScenario({ name, definition })` from `electron/database/models/scenarios.js`
- Stores the assembled `scenarioDefinition` as a JSON string in the `definition` column of the `scenarios` table

## Files Changed

**Created:**
- `docs/features/scenario-authoring.md`

**Pre-existing (no changes needed):**
- `electron/main.js` — `create-scenario` IPC handler
- `electron/database/models/scenarios.js` — `createScenario()` function
- `frontend/src/pages/Home/components/CreateScenarioModal.jsx`
- `frontend/src/pages/Home/components/forms/` — all 9 sub-form components

---

**Author:** Trey Springer (Frontend Team)
**Date:** March 15th, 2026
**Sprint:** Sprint 3 of Winter Term
