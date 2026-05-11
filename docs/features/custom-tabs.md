# Custom Tabs (Specialty Sections)

The **Custom Tabs** feature allows scenario authors to define arbitrary "blank box" sections that appear as additional tabs during a patient simulation. This turns a static view into an interactive data-entry form, enabling customized training scenarios such as tracking Urine Output, comprehensive Wound Assessments, or specialized physical exams.

## Overview

- **Authoring**: On the Home page's scenario creation/edit form, instructors can use the "Custom Sections" form to add new tabs and define specific fields (text, number, or textarea) along with optional units and placeholder text.
- **Data Model**: The custom tabs are saved in the scenario JSON under the `customTabs` property.
- **Simulation**: During a session, the simulation engine copies `customTabs` into the session state. The `SimulationPage` dynamically renders these tabs alongside the standard ones (Vitals, Medications, Orders, Notes).

## Architecture

* **`CustomTabsForm.jsx`**: A form block component used by the instructor to build the tab structures.
* **`CustomTab.jsx`**: A generic card-grid component that renders a specific custom tab's fields dynamically during the simulation, binding inputs to the session's state changes.
* **`SimulationPage.jsx`**: Iterates through the scenario's `customTabs` array, merging them with the static tabs, automatically assigning keyboard hints (`[5]`, `[6]`, etc.), and handling state updates for field values.
* **`simulation.js` (Backend)**: Passes `customTabs` from the initial state creation through to the `formatState` function so it's included in IPC responses to the frontend.

## Example Scenario Data Structure

```json
{
  "customTabs": [
    {
      "id": "urine-output",
      "label": "Urine Output",
      "fields": [
        {
          "key": "volume",
          "label": "Latest Volume",
          "type": "number",
          "placeholder": "Enter ml",
          "unit": "ml"
        },
        {
          "key": "color",
          "label": "Color/Appearance",
          "type": "text",
          "placeholder": "e.g., pale yellow, cloudy",
          "unit": ""
        }
      ]
    }
  ]
}
```

## Adding and Modifying Custom Tabs
To modify how custom tabs are displayed during simulation, the primary logic lives in `SimulationPage.jsx` and `CustomTab.jsx`. The layout assumes a two-column grid (controlled by `CustomTab`). When extending field types (e.g., adding a "checkbox" type), `CustomTabsForm.jsx` must be updated to allow selection, and `CustomTab.jsx` must be updated to render the new HTML input type appropriately.
