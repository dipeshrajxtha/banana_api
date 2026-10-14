# Fast Ride - Road Rash Style Bike Racing Game

An event-driven full-stack 2D bike racing game built for **CIS046-3: Software for Enterprise**.

## 🚀 Overview
Fast Ride is a fast-paced Road Rash inspired motorcycle racing game featuring:
- **Interactive Retro Canvas Gameplay**: High-speed racing, traffic dodging, and combat against rival bikers.
- **Banana API Pit Stop & Nitro Mechanic**: Real-time integration with the Banana Puzzle API to unlock nitro boosts and repair bike health.
- **Racer Virtual Identity**: Secure registration, login, and profile persistence with encrypted passwords and JWT/cookie session handling.
- **Live Leaderboard & Garage**: Track career stats, best lap times, and unlocked bikes.

## 🏛️ Academic Themes & Architecture
1. **Version Control & Modularity**: Feature-branch workflow, clean separation between frontend, backend, and external service layers.
2. **Interoperability**: RESTful HTTP communication integrating third-party web services (Banana API) and backend endpoints with JSON payload contracts.
3. **Event-Driven Architecture**: DOM keyboard events, animation frame events (`requestAnimationFrame`), collision events, and asynchronous event loops.
4. **Virtual Identity**: Authentication & authorization protocols, password hashing with bcrypt, stateless JWT tokens, and secure session management.

## 🛠️ Tech Stack
- **Frontend**: React, Canvas 2D API, Modern CSS
- **Backend**: Node.js, Express.js
- **Database/Storage**: SQLite / JSON Store for persistent racer profiles & leaderboards
- **Third-Party Service**: Marc Conrad's Banana API
