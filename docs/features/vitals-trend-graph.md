# Vitals Trend Graph

The **Vitals Trend Graph** is a real-time visualization tool that plots a patient's vital signs over the course of a simulation session. It helps nursing students understand the impact of time and their medication titrations on patient outcomes.

## Overview

- **Real-time Tracking**: Accumulates data points as the simulation progresses (each "tick" represents ~5-8 seconds in real time depending on configuration).
- **Interactive Visualization**: Built with pure SVG (Zero external dependencies). Supports hovering for exact data values and clicking legend items to filter which vitals are displayed.
- **Auto-Scaling**: The Y-axis automatically scales based on the min and max values of the currently visible vital signs, ensuring the data is always readable.

## Architecture

* **`VitalsTrendGraph.jsx`**: A reusable, stateless React component responsible only for drawing the SVG lines, axes, tooltips, and legend based on an array of history snapshots.
* **`HomePage.jsx` / `ActiveSimulationPanel.jsx`**: Manages the `vitalsHistory` state. It listens to updates from the `activeSession.state` and pushes a snapshot containing `{ tick, timestamp, vitals }` to the history array.
* **Memory Management**: To prevent performance degradation during long simulations, the history acts as a rolling buffer, capped at the most recent 100 entries. It resets whenever a new session begins.

## Key Vitals Tracked

The graph maps specific colors and units to each vital sign via the internal `VITAL_CONFIG` dictionary:

| Vital | Color | Base Unit |
|-------|-------|-----------|
| Heart Rate | Red (`#ef4444`) | bpm |
| O₂ Saturation | Green (`#10b981`) | % |
| Respiratory Rate | Orange (`#f59e0b`) | /min |
| Temperature | Purple (`#8b5cf6`) | °F |
| BP Systolic | Blue (`#3b82f6`) | mmHg |
| BP Diastolic | Light Blue (`#60a5fa`) | mmHg |

## Extending the Graph

To add a new data point to the graph (for example, a custom blood glucose level):
1. Add the configuration (label, color, unit) to the `VITAL_CONFIG` object inside `VitalsTrendGraph.jsx`.
2. Ensure the front-end state management in `HomePage.jsx` extracts the new data point from the `activeSession.state` and maps it correctly into the `vitalsHistory` array entry.
3. Update the `selectedVitals` prop being passed to `VitalsTrendGraph` to include the new key by default.
