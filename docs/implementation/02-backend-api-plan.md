# 02 - Backend API Architecture & Implementation Plan

Date: 2026-02-23
Topic: Backend Architecture (Wiring React to PostgreSQL via Express)
Location: `docs/implementation/02-backend-api-plan.md`

*(Note: Strictly no changes in UI design)*

**Skills Utilized**: 
- `/Users/praneshjs/Education/Clario3/.agent/skills/supabase-postgres-best-practices/SKILL.md`
*(Note: There are no specific internal `.skills` files for Firebase/Express available currently, so relying on standard industry best practices.)*

Now that the database schema is firmly established and the React frontend is isolated in `/frontend`, the next logical phase is to build the connective tissue: **The Backend API**.

---

## 1. Technical Stack

Per your directives, the stack for the API layer will strictly be:

*   **Runtime:** Node.js (v20+)
*   **Framework:** Express.js
*   **Authentication:** Firebase Authentication (JWT Verification handling)
*   **Database Client:** Drizzle ORM connecting to PostgreSQL.

---

## 2. Authentication Flow (Firebase integration)

The API will not handle actual password hashing or session cookies. Instead, it will blindly trust Firebase as the Identity Provider (IdP).

### Flow Breakdown:
1.  **Frontend (React):** User logs in via the Firebase Client SDK. Firebase returns an ID Token (JWT).
2.  **API Requests:** The frontend attaches `Authorization: Bearer <Firebase_ID_Token>` to every secure fetch call.
3.  **Express Middleware:** Every protected route on the Express backend runs through a middleware that calls `firebase-admin.auth().verifyIdToken(token)`.
4.  **Database Sync:** If the token is valid, Express extracts the Firebase `uid` and email. It then checks the PostgreSQL `users` table. If the user doesn't exist yet (first log in), it inserts them into the database before proceeding with the request.

---

## 3. API Structural Endpoints

The backend needs to expose the following explicit core domains to support the existing MVP UI:

### A. Authentication & User State
*   `POST /api/v1/auth/sync` → The frontend calls this after Firebase login. Express verifies the token and strictly ensures the Postgres `users` row exists.
*   `GET /api/v1/users/me` → (Protected) Returns the Postgres user profile + `user_mastery_snapshot` (for the `<TopBar>` XP pill).

### B. Gamification & Duels (Target Scope)
*   `POST /api/v1/duels/request` → (Protected) Initiates a duel state in Postgres (`status = 'pending'`).
*   `POST /api/v1/duels/:id/accept` → (Protected) Transitions duel to `active` state.
*   `WS /api/v1/duels/:id/stream` → (Protected) WebSockets. Streams live player connectivity, answer statuses, and millisecond timers directly out of the Redis duel state.
*   `POST /api/v1/duels/:id/submit` → (Protected) Submits an answer for the active duel. Validates against Postgres, updates Redis state, and persists to `duel_events`.

*(Note: Content fetching, Adaptive Engine, and Leaderboards are excluded from this specification as per the stated scope.)*

---

## 4. Implementation Sandbox (Execution Roadmap)

To bring this Express API layer to life, the execution must happen in this exact order:

1.  **Repository Setup:** 
    *   Create a `/backend` directory alongside `/frontend`.
    *   Run `npm init -y` inside `/backend`.
    *   Install core dependencies: `npm install express cors dotenv firebase-admin`.
2.  **Firebase Registration:** 
    *   Set up a Firebase project in the Firebase Console.
    *   Generate a Server Service Account Key (`.json`) and store its path in the backend `.env` file for `firebase-admin` to use.
3.  **ORM Initialization:** 
    *   Install the chosen ORM.
    *   Initialize it and generate the TypeScript schemas matching the Postgres Migration files created previously.
4.  **Auth Middleware Creation:** 
    *   Create `/src/middleware/firebaseAuth.js` which blocks requests lacking a valid bearer token.
5.  **Route Scaffolding:** 
    *   Create the folder structure for the controllers (`/src/controllers/user.js`, `/src/controllers/quiz.js`, etc.).
6.  **Frontend Wiring:** 
    *   Inside `/frontend`, install `firebase` client SDK.
    *   Set up an Axios interceptor to automatically inject the Firebase Token into all headers.
    *   Configure Vite (`vite.config.js`) to proxy `/api` requests to `http://localhost:3000` to prevent CORS during local development.
