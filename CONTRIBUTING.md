# Contributing & Version Control Guide — Banana Quest
## CIS046-3: Software for Enterprise — Module Assignment

This document outlines the professional software engineering standards, Gitflow branching model, and component modularity practices implemented in the **Banana Quest** enterprise repository.

---

## 1. Branching Strategy (Gitflow Workflow)

To ensure enterprise-grade version control, code isolation, and clear auditability, this repository follows the standard **Gitflow branching model**:

```
[main] (Production releases, strictly tagged: v0.1.0, v1.0.0)
   ^
   |-- [release/v*] (Stabilization, final QA, documentation)
   |
[develop] (Integration branch for ongoing sprint features)
   ^
   |-- [feature/monorepo-setup]
   |-- [feature/server-core]
   |-- [feature/auth-core]
   |-- [feature/google-oauth]
   |-- [feature/banana-api-integration]
   |-- [feature/puzzle-engine]
   |-- [feature/player-dashboard]
   |-- [feature/admin-panel]
```

### Branch Responsibilities
- **`main`**: Contains only verified, production-ready releases. Direct commits are restricted. All merges into `main` are accompanied by semantic release tags (`git tag -a v1.0.0`).
- **`develop`**: Serves as the primary integration branch where completed feature branches converge.
- **`feature/<feature-name>`**: Dedicated short-lived branches created from `develop` for implementing distinct system components. Merged back via Pull Requests.
- **`release/v<version>`**: Created prior to major milestone assessments (e.g., Week 8 Tutor Milestone) for smoke-testing and version bumping.

---

## 2. Commit Message Standards (Conventional Commits)

All commits must follow the **Conventional Commits 1.0.0** specification to maintain granular, human-readable, and machine-parsable history:

$$\text{type(scope): summary}$$

### Recognized Commit Types:
- `feat`: Introduces a new feature or functionality (e.g., `feat(auth): implement Google OAuth 2.0 ID token verification`).
- `fix`: Resolves a bug or defect (e.g., `fix(game): correct countdown timer drift on tab blur`).
- `docs`: Documentation updates only (e.g., `docs: update API endpoints in README`).
- `chore`: Maintenance tasks, tooling, or dependency updates (e.g., `chore: configure root npm workspaces`).
- `refactor`: Code reorganization that neither adds a feature nor fixes a bug (e.g., `refactor(events): decouple audio synthesis from game loop`).
- `test`: Adding or updating automated unit and integration tests.

---

## 3. Monorepo Component Architecture & Modularity

The repository enforces modular separation of concerns across three workspaces:

```
fast_ride/
├── client/          # Frontend Web Application (React 18, Canvas Engine, Modern CSS)
├── server/          # Backend REST API Service (Node.js, Express, SQLite, Auth)
├── shared/          # Shared type definitions, API payload contracts, and scoring constants
├── Assignment_brief/# University documentation and rubric requirements
├── CONTRIBUTING.md  # Gitflow & development guidelines
└── package.json     # Monorepo workspace configuration
```

### Component Responsibilities:
1. **`client/`**: Handles user interaction, DOM events, audio synthesis, HUD rendering, and Google Sign-In SDK.
2. **`server/`**: Acts as the secure intermediary and API gateway. Handles user authentication, database persistence, and proxies Marc Conrad's Banana API with caching and timeout resilience.
3. **`shared/`**: Contains immutable domain constants (e.g., game modes, player grade thresholds, API error codes) imported by both client and server to prevent contract drift.

---

## 4. Academic Integrity & Third-Party Code Citation

Per the CIS046-3 assignment brief:
- All external dependencies and libraries must be documented in `package.json` lockfiles.
- Any code derived from university examples or external APIs (such as Marc Conrad's Banana API `http://marcconrad.com/uob/banana/`) must contain formatted JSDoc headers citing the source author, URL, and purpose.
