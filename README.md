# EHR Module Simulator

The EHR Module Simulator is a desktop application designed to help nursing students at OHSU practice real-world clinical decision-making and documentation in a simulated Electronic Health Record (EHR) environment.

Students can interact with simulated patient charts, review provider orders, interpret clinical data, and perform virtual actions such as titrating medications or documenting care — just as they would in a real EHR system. Instructors can author custom scenarios, build quizzes, and review student performance.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Building for Distribution](#building-for-distribution)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Features

- **Scenario Simulations** — Run realistic patient care scenarios with live vital sign updates, medication administration, and provider orders
- **Scenario Authoring** — Instructors can create fully customizable scenarios via a multi-section form (patient info, vitals, medications, orders, custom tabs, and more)
- **Vitals Trend Graph** — Real-time SVG visualization of patient vital signs over time with interactive legend and tooltips
- **Custom Tabs** — Instructors define additional documentation sections (e.g., Urine Output, Wound Assessment) that appear alongside standard simulation tabs
- **Quizzes** — Create, assign, and grade multiple-choice and true/false quizzes with submission history
- **Session Summaries & PDF Export** — Automatic action logging during simulations with downloadable PDF summaries
- **Scenario Import/Export** — Share scenarios between app instances via SQLite database files
- **Search & Filters** — Find scenarios by name, diagnosis, difficulty, specialty, or tags
- **Keyboard Shortcuts** — Navigate tabs, pause/resume simulations, and control the app without a mouse
- **Role-Based Access** — Student and Instructor roles with appropriate UI controls
- **Offline-First** — Runs entirely offline with a local SQLite database

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, React Router, Vite, Vanilla CSS |
| **Desktop Shell** | Electron, Electron Forge |
| **Database** | SQLite via better-sqlite3 |
| **Build & CI** | GitHub Actions, ESLint, Prettier |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (included with Node.js)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/cbgabler/ehr-module-simulator.git
cd ehr-module-simulator
```

### 2. Install dependencies

```bash
cd frontend
npm install

cd ../electron
npm install
```

### 3. Run in development mode

In one terminal, start the React dev server:
```bash
cd frontend
npm run dev
```

In a second terminal, start the Electron shell:
```bash
cd electron
npm start
```

### Default Accounts

| Role | Username | Password |
|---|---|---|
| Instructor | `instructor1` | `password123` |
| Student | `student1` | `password123` |

> **Note:** These are demo accounts. Create individual accounts for production use.

---

## Building for Distribution

To produce an installable binary for desktop, run the following from the `electron/` directory:

```bash
cd electron
npm run make
```

This will automatically:
1. Build the React frontend (`frontend/`)
2. Copy the built frontend into `electron/build/`
3. Package the Electron app and produce installers in `electron/out/make/`

**Output files:**
- **Windows:** `electron/out/make/squirrel.windows/x64/EHR Module Simulator-1.0.0 Setup.exe`
- **macOS:** `electron/out/make/dmg/EHR Module Simulator-1.0.0.dmg`

> Electron cannot cross-compile — Windows installers must be built on Windows, macOS installers on a Mac.

---

## Project Structure

```
ehr-module-simulator/
├── frontend/               # React + Vite frontend
│   └── src/
│       ├── pages/          # Page components (Auth, Home, Simulation, Quizzes)
│       ├── utils/          # Shared hooks and helpers
│       └── App.jsx         # Router and protected routes
├── electron/               # Electron main process
│   ├── database/           # SQLite models, migrations, and queries
│   ├── utils/              # PDF export and other utilities
│   ├── main.js             # IPC handlers and app lifecycle
│   └── preload.cjs         # Context bridge API
├── docs/                   # Project documentation
│   ├── features/           # Feature documentation
│   ├── database/           # Schema and versioning docs
│   └── import-export/      # Import/export guides
└── .github/                # CI workflows and code owners
```

---

## Documentation

Full project documentation is available in the [`docs/`](docs/README.md) directory, including:

- [Installation Guide](docs/installation-guide.md) — End-user setup instructions
- [Contributing Guide](docs/contributions.md) — Development workflow and standards
- [Database Schema](docs/database/schema.md) — Complete database reference
- [Feature Docs](docs/features/) — Detailed documentation for each feature

---

## Contributing

1. Fork and clone the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (`feat:`, `fix:`, `chore:`, etc.)
4. Push and open a Pull Request against `main`

See the full [Contributing Guide](docs/contributions.md) for branching strategy, code style, PR requirements, and CI details.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contact

| Name | Role | Email |
|---|---|---|
| Carson Gabler | Project Manager | [gablerc@oregonstate.edu](mailto:gablerc@oregonstate.edu) |
| AJ Paumier | Backend Developer | [paumiera@oregonstate.edu](mailto:paumiera@oregonstate.edu) |
| Thien Tu | Backend Developer | [tuthi@oregonstate.edu](mailto:tuthi@oregonstate.edu) |
| Trey Springer | Frontend Developer | [springet@oregonstate.edu](mailto:springet@oregonstate.edu) |
| Kristy Chen | Frontend Developer | [chenkr@oregonstate.edu](mailto:chenkr@oregonstate.edu) |
