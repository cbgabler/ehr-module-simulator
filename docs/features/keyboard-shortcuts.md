# Keyboard Shortcuts System

The EHR Module Simulator implements global keyboard shortcuts to improve usability, allowing quick navigation and control actions without requiring a mouse.

## Overview

Shortcuts fall into two main categories:
1. **Simulation Control & Navigation**: Pause/resume, end the session, or switch between tabs (Vitals, Medications, Orders, Notes, etc.).
2. **Global Modals**: Closing dialogs and overlays using the Escape key.

By default, shortcuts are **disabled** when the user is actively typing in a text input, textarea, or content-editable field to prevent accidental triggers.

## Available Shortcuts

| Context | Shortcut | Action |
|---------|----------|--------|
| Simulation Page | `Space` | Pause / Resume the simulation |
| Simulation Page | `1` - `4` | Switch to fixed tabs (Vitals, Meds, Orders, Notes) |
| Simulation Page | `5` - `9` | Switch to custom tabs (dynamically mapped) |
| Simulation Page | `N` | Quick-focus the Notes text area |
| Simulation Page | `Escape` | Attempt to end the simulation (triggers confirmation modal) |
| Modals (Global) | `Escape` | Close the currently open modal dialog |

## Architecture

The system relies on a reusable custom React hook: `useKeyboardShortcuts.js`.

### `useKeyboardShortcuts` usage

This hook is declarative, accepting an object mapping keys to callback functions. 

```javascript
import useKeyboardShortcuts from "../../utils/useKeyboardShortcuts";

useKeyboardShortcuts({
  "Space": () => toggleSimulationState(),
  "Escape": () => setShowEndConfirm(true),
  "1": () => setActiveTab("vitals"),
  "n": () => focusNotesRef.current?.focus(),
}, { ignoreInputs: true, enabled: isSimulationActive });
```

### Configuration Options
* `ignoreInputs` (boolean, default `true`): If true, prevents shortcuts from firing if `document.activeElement` is an `<input>`, `<textarea>`, or `<select>`. This is crucial for stopping the `Space` key from pausing the simulation while a student is typing a clinically relevant note.
* `enabled` (boolean, default `true`): A toggle to easily turn off the shortcut listener based on component state (e.g., turning off simulation hotkeys when the user navigates away).

## Extending Shortcuts

To add support for complex modifier combinations (e.g., `Ctrl+S`), the hook processes the browser's KeyboardEvent and standardizes the prefix string. You can define keys like `"ctrl+s"` or `"shift+r"`. The modifier checks map `metaKey` (Command on Mac) and `ctrlKey` identically for cross-platform compatibility.
