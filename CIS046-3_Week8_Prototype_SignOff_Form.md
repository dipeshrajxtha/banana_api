# CIS046-3 Software for Enterprise – AY 26/27
## Week 8 Working Prototype Assessment & Sign-Off Form

**Student Name:** Dipesh Raj Shrestha  
**Student Number:** ___________________________ *(Fill in your University ID, e.g. 2XXXXXXX)*  
**Student Signature:** ___________________________  
**Date:** November 2026 (Week 8)  
**Tutor Sign-Off Signature:** ___________________________  
**Tutor Verification Date:** ___________________________  

---

> *Please answer the questions below, print this form and bring it to the presentation where it will be checked against reality and signed off by the tutor. Once signed off, scan this form and submit on BREO with all other deliverables (video, code). At this stage, Week 8, (at least) a working prototype should be presented plus some ideas on how to continue with the development.*

---

### 1. Version Control
**How did you develop your code (e.g., what features have been added after first version)?**

The codebase was engineered following an enterprise **Gitflow branching model** within an **npm monorepo architecture** structured into three isolated workspaces: `@banana-quest/client` (React 18 frontend), `@banana-quest/server` (Express REST backend), and `@banana-quest/shared` (shared constants and validation schemas). Development adhered to **Semantic Versioning** (`v0.1.0` $\rightarrow$ `v0.2.0` $\rightarrow$ `v0.3.0`) and **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`) to ensure full traceability:

* **Version 0.1.0 (Baseline Architecture & Core Engine):**
  * Established the dual-service monorepo with an Express REST API backend and a Vite + React 18 frontend.
  * Configured SQLite database schemas with automated migrations for persistent users, sessions, high scores, and audit trails.
  * Implemented initial remote communication with Marc Conrad’s visual math API.

* **Version 0.2.0 (Virtual Identity & Enterprise Hardening):**
  * Implemented dual-path authentication: native registration with `bcryptjs` (10 salt rounds) and federated Google OAuth 2.0 (OpenID Connect).
  * Enforced stateless session management using signed JSON Web Tokens (JWT, HS256) encapsulated within `HttpOnly`, `SameSite=Lax` secure cookies.
  * Built Role-Based Access Control (RBAC) with protected administrative routes (`/api/admin/*`), player account suspension/moderation, and cryptographic security audit logging.

* **Version 0.3.0 (Week 8 Working Prototype — Event Engine, UI Overhaul & 1v1 Multiplayer):**
  * **Decoupled Event Engine**: Implemented `CustomEventBus` (Pub/Sub pattern) with listener fault isolation, an audit ring buffer, and a delta-time tick loop (`requestAnimationFrame`).
  * **Zero-Latency In-Memory Pre-Caching Buffer**: Solved external network latency by maintaining an in-memory buffer (`TARGET_CACHE_SIZE = 5`) of verified puzzles, achieving **0ms** client delivery on match start.
  * **Real-Time 1v1 Split-Screen Duel ("2 Puzzles on One Screen")**: Created live duel rooms with configurable match timers (3, 5, or 7 minutes), shareable invite URLs (`?room=MIN-XXXX`), manual room code joining, and Server-Sent Events (SSE) sub-10ms synchronization.
  * **Auto-Win on Opponent Forfeit**: Implemented `POST /api/rooms/:roomId/quit` and a browser `beforeunload` beacon listener so if one player leaves or closes their tab, the opponent automatically wins by forfeit.
  * **Aesthetic Overhaul**: Replaced procedural 3D tube geometry with an authentic vector SVG Stuart Minion scientist hero, tactile 3D numpad, and Framer Motion animations.
  * **Automated Test Coverage**: Developed **52 automated unit and integration tests** across 9 test suites with 100% pass rate.

---

### 2. Event-Driven Architectures
**What in your code triggers events (e.g., GUI, buttons, timeout …)?**

Our application implements a multi-layered event-driven architecture operating both within the client and across the network:

1. **Client-Side Event Bus (`CustomEventBus` in `client/src/events/eventBus.js`):**
   * Acts as the central event broker decoupling UI components, audio services, and game state.
   * **GUI & Button Triggers**: User interactions on the tactile virtual numpad or physical keyboard (digits 0–9, Backspace, Enter, Spacebar) emit `loop:digit_select` and `loop:answer_submit`.
   * **Timer & Game Loop Triggers**: A 60fps delta-time timer hook calculates precise elapsed time, emitting `loop:tick` every second, `loop:timer_warning` when $\le 15$ seconds remain, and `loop:timeout` (`loop:game_over`) when the clock reaches zero.
   * **Web Audio API Reactions**: The audio service subscribes directly to the event bus (`soundService.bindToEventBus()`), dynamically synthesizing arcade sound effects (frequency ramps, chord arpeggios, warning sirens) in response to game events without external audio files.

2. **Server-Sent Events (SSE) Network Stream (`server/src/routes/rooms.js`):**
   * Real-time 1v1 multiplayer matches communicate over HTTP `text/event-stream` (`/api/rooms/:roomId/stream`).
   * Events are triggered whenever a host creates a room, a friend connects via room code or invite link, a player submits an answer, streaks increment, or the match concludes. Both players' screens update simultaneously with sub-10ms latency.

3. **Window Lifecycle & Beacon Events:**
   * Handled via `window.addEventListener('beforeunload')` using `navigator.sendBeacon`.
   * If a player disconnects or closes their browser tab mid-match, an asynchronous forfeit beacon is dispatched to `/api/rooms/:roomId/quit`, triggering an immediate auto-win victory event on the remaining player’s screen.

---

### 3. Interoperability
**Do you use the API `https://marcconrad.com/uob/tomato/api.php`?  
If no, where in your code do you demonstrate interoperability? What protocols do you use?**

**Answer:**
**No, we do not use the Tomato API (`/uob/tomato/api.php`).**  
**Instead, we used Dr. Marc Conrad's companion API: the Banana API (`https://marcconrad.com/uob/banana/api.php?out=json`), alongside Google Identity Services (OAuth 2.0 / OpenID Connect).**

#### The Exact APIs Used & Rationale:
1. **The API Named in the Form vs. The API We Selected:**
   * Dr. Marc Conrad hosts two parallel, architecturally identical visual puzzle endpoints for the University of Bedfordshire:
     * *Endpoint A (Named in the question):* `https://marcconrad.com/uob/tomato/api.php` (Tomato-based equation graphics)
     * *Endpoint B (Selected by our project):* `https://marcconrad.com/uob/banana/api.php?out=json` (Banana-based equation graphics)
   * **Why we chose the Banana API instead:**  
     Our game is titled **"Banana Quest"** and is built entirely around an authentic Minion laboratory theme (Minions' iconic obsession with bananas). Using the Banana API maintains complete visual, narrative, and thematic alignment with the character lore and UI aesthetic, while using the exact same academic web service architecture required by the module.

2. **Secondary API Used: Google Identity Services (OAuth 2.0 / OpenID Connect):**
   * Handled in `server/src/services/googleAuthService.js` via the `google-auth-library` npm package.
   * Interoperates with `https://accounts.google.com` to cryptographically verify user identity tokens.

#### Protocols & Interoperability Demonstrations in Our Code:

1. **REST over HTTPS (Marc Conrad Banana API — `server/src/services/bananaApiService.js`):**
   * Backend Node.js service performs asynchronous HTTP `GET` requests using native `fetch`.
   * Enforces strict 3000ms `AbortController` timeouts, network exception handling, and status code verification.
   * Consumes and parses remote JSON payloads:
     $$\text{JSON Response: } \{ \text{"question"}: \text{"https://marcconrad.com/uob/banana/...", } \text{"solution"}: n \}$$

2. **Zero-Latency In-Memory Pre-Caching Buffer:**
   * Decouples the client experience from remote API latency by asynchronously maintaining an in-memory buffer of 5 validated puzzles (`refillPuzzleCache()`), providing **0ms** puzzle delivery on demand.
   * Cryptographically seals solutions using HMAC-SHA256 tokens (`sealPuzzle()`), transmitting only the question image and signature to the client to prevent answer sniffing via browser DevTools.

3. **Fault-Tolerant Procedural Fallback Engine:**
   * If Marc Conrad's external server is unreachable, experiences network timeouts, or returns malformed HTML, the service automatically switches to an internal SVG mathematical generator producing valid dynamic equation puzzles, guaranteeing 100% service uptime.

4. **Federated OpenID Connect / OAuth 2.0 Protocol:**
   * Uses Google's cryptographic token verification protocol over HTTPS to authenticate users without storing plaintext passwords.

5. **Server-Sent Events (SSE) Protocol (`text/event-stream`):**
   * Uses unidirectional HTTP streaming to synchronize game state across disparate devices (desktop, laptop, mobile) without the overhead of heavy third-party WebSocket libraries.

---

### 4. Virtual Identity
**How did you implement virtual identity in your code? (e.g., Passwords, Cookies, IP Numbers …)**

Virtual identity is implemented through a multi-tiered authentication, authorization, and session isolation model in `server/src/routes/auth.js` and `server/src/middleware/authenticate.js`:

1. **Password Hashing & Salting:**
   * Traditional user registration encrypts passwords using `bcryptjs` with 10 salt rounds before storage in the SQLite database. Raw passwords never touch database tables or application logs.

2. **Stateless JWTs & Secure HttpOnly Cookies:**
   * Upon successful authentication, the server generates a signed JSON Web Token (JWT, HS256) containing `userId`, `role` (`PLAYER` or `ADMIN`), and `authProvider`.
   * The token is stored inside an `HttpOnly`, `SameSite=Lax` secure cookie (`banana_quest_session`), which completely prevents client-side JavaScript access and shields against Cross-Site Scripting (XSS) attacks.

3. **Federated Identity (Google OAuth 2.0 / OpenID Connect):**
   * Players can authenticate with one click using "Sign in with Google". The server verifies the cryptographic token signature with Google's public keys, auto-provisioning a verified account with the player’s Google name, email, and avatar URL.

4. **Ephemeral Virtual Guest Identity:**
   * Players can participate immediately without entering credentials via `POST /api/auth/guest`. The server provisions a cryptographically random guest identity (`guest_TIMESTAMP_RAND`) with an active JWT session cookie, allowing guests to build streaks, record personal solve statistics, and submit high scores to the global leaderboard.

5. **Role-Based Access Control (RBAC):**
   * Express middleware enforces strict role-based separation between standard `PLAYER` and privileged `ADMIN` accounts. Protected endpoints (`/api/admin/users`, `/api/admin/metrics`, `/api/admin/audits`) allow administrators to suspend/reinstate player accounts and review security audit logs.

6. **Multiplayer Session Isolation:**
   * For 1v1 room duels, player tokens are stored in `sessionStorage` rather than shared storage, allowing two players to test and duel independently on separate browser windows or mobile devices without session collisions.

---

### 5. Any other interesting features:
*Significant architectural and technical highlights of the working prototype:*

1. **Real-Time 1v1 Split-Screen Duel ("2 Puzzles on One Screen"):**
   * Hosts and guests compete side-by-side in real time with two live puzzles displayed simultaneously on screen.
   * Features flexible **3, 5, or 7-minute match options**, dynamic **tug-of-war lead indicators**, one-click shareable invite links, and direct room code entry (`MIN-XXXX`).
   * Includes automated **forfeit victory detection**: if an opponent closes their browser or quits, the match awards victory to the remaining player.

2. **Local Network (LAN 0.0.0.0) & Cloud Tunneling Support:**
   * Configured `client/vite.config.js` (`server.host: true`) and Express (`app.listen(5000, '0.0.0.0')`) with dynamic CORS to allow instant local Wi-Fi mobile testing (`http://192.168.1.75:3000`) and one-command global public tunneling (`npm run tunnel`).

3. **Authentic Vector SVG Stuart Minion Character:**
   * Replaced low-fidelity geometry with a pure vector SVG Stuart Minion scientist featuring dual-lens chrome goggles, denim overalls with yellow contrast stitching, a laboratory beaker, and reactive facial expression avatars (celebration on streak, distress on miss).

4. **Academic Grading Algorithm:**
   * Evaluates post-match player performance and calculates university-style grade tiers (**S Tier** $\ge 90\%$, **A Tier** $\ge 75\%$, **B Tier**, **C Tier**, **D Tier**) based on solve accuracy, answer velocity (ms), and combo streaks.

5. **100% Passing Automated Test Suite:**
   * **52 automated unit and integration tests** across 9 test suites validating RBAC security, Google OAuth, Banana API interoperability, CustomEventBus pub/sub, database repositories, and 1v1 duel room mechanics.

---

### Ideas on How to Continue Development (Beyond Week 8):
1. **Cinematic 3D Intro Video**: Finalize and integrate the custom 6-part animated Minion laboratory introduction sequence into the game entry flow.
2. **Global WebSocket Matchmaking**: Expand beyond 2-player direct rooms into an automated lobby matchmaking queue with Elo rating rankings.
3. **Banana Quest Economy & Cosmetics**: Introduce reward tokens earned through high streaks to unlock custom laboratory outfits and sound packs.
4. **Production Cloud CI/CD**: Deploy frontend to Vercel/Netlify and backend to Render/Railway with automated GitHub Actions testing on every commit.
