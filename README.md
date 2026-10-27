# Banana Quest — CIS046-3 Software For Enterprise

An enterprise-grade, event-driven web puzzle game built on **Marc Conrad's Banana API** for **CIS046-3: Software for Enterprise** (University of Bedfordshire).

---

## 🎯 Project Overview
**Banana Quest** is a fast-paced, brain-teasing puzzle game that tests players' mental math and visual deduction:
- **Banana Puzzle Engine**: Directly connects to Marc Conrad's Banana API (`http://marcconrad.com/uob/banana/api.php?out=json`) to fetch dynamic math puzzle challenges.
- **Game Modes**:
  - **Speed Rush (Arcade)**: 60-second race against the clock with combo multipliers for rapid answers.
  - **Survival Mode (3 Strikes)**: 3 lives, decreasing timer per puzzle, test how far you can go.
- **Virtual Identity**: "Continue with Google" (Google OAuth 2.0 / OpenID Connect) + persistent player profiles and JWT in HttpOnly cookies.
- **Player Dashboard**: High scores, average solve speed (ms), accuracy graph, and dynamic S/A/B/C/D player grading.
- **Global Leaderboard**: Live global ranking of top puzzle solvers.
- **Admin Panel**: Player moderation, security audit logs, and live Banana API health & latency monitor.

---

## 🏛️ Academic Themes & Architecture (Target: 90%+ Distinction)
1. **Version Control**: Gitflow branching (`feature/*`, `develop`, `release/*`, `main`), semantic commits, release tagging (`v0.1.0` to `v1.0.0`), and modular separation.
2. **Event-Driven Programming**: Custom Event Bus (`EventEmitter`), reactive keyboard/numpad events, tick timer loops, and decoupled UI HUD updates.
3. **Interoperability**: Distributed REST communication with **Marc Conrad's Banana API** and **Google Identity Services**, JSON serialization, in-memory caching, and offline fallback generator.
4. **Virtual Identity**: Google OAuth 2.0 federation, bcrypt password hashing, stateless JWT session tokens, and Role-Based Access Control (Player vs Admin).

---

## 🛠️ Technology Stack
- **Frontend**: React 18, HTML5 Canvas & Web Audio API, Vanilla CSS (Modern Glassmorphism & Dark Mode)
- **Backend**: Node.js, Express.js REST API
- **Database**: SQLite / Persistent JSON store with relational schema
- **External Web Services**:
  - Marc Conrad's Banana API (`http://marcconrad.com/uob/banana/`)
  - Google Identity Services (OAuth 2.0 / OpenID Connect)
