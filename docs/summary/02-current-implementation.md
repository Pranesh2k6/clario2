# 02 - Current Implementation Status (Backend API Added)

Date: 2026-02-23
Location: `docs/summary/02-current-implementation.md`
Context: Progress checkpoint after completing the Backend API scaffolding for Authentication and Gamification/Duels.

## 1. Overall System Architecture
The application is now physically split into three cleanly separated tiers:
1.  **Frontend (`/frontend`)**: React + Vite SPA.
2.  **Backend (`/backend`)**: Node.js + Express API.
3.  **Database (`/db/migrations`)**: PostgreSQL SQL Schema Definitions.

## 2. Frontend Status
*   **Location:** `/frontend`
*   **State:** The frontend is a high-fidelity, interactive prototype.
*   **Features:** Dashboard, Galaxy Map (topic selection), Duel finder UI, Leaderboard UI, and the interactive physics Learn/Quiz modes are all visually polished and state-driven.
*   **Connection:** Vite is configured to proxy all `/api/*` requests to `http://localhost:3000`, cleanly sidestepping any CORS development headaches. Note: It is currently operating on hardcoded mock data until the frontend fetch layers are wired to the newly created backend.

## 3. Database Status
*   **Location:** `/db/migrations`
*   **State:** The complete architectural blueprint exists as pure SQL DDL migrations, ready to be executed against a fresh PostgreSQL instance (like Supabase or local Postgres).
*   **Structure:**
    *   `001`: Core Users and the immutable, partitioned XP Ledger.
    *   `002`: The Taxonomy engine (Subjects → Chapters → Concepts → Questions).
    *   `003`: Gamification systems (Duels, Badges, Streaks, Concept Debt).
    *   `004`: Telemetry clustering (Attempt histories).

## 4. Backend API Status ( newly completed )
*   **Location:** `/backend`
*   **State:** Express.js server scaffolded, strictly scoped to handle Authentication and Duels processing. Unrelated endpoints (content fetching) were intentionally omitted.
*   **Core Mechanics Implemented:**
    *   **PostgreSQL Pool:** `src/config/db.js` exposes a single connection pool utilizing the `pg` driver to connect via `DATABASE_URL`.
    *   **Firebase Authentication:** `src/config/firebase.js` initializes the Firebase Admin SDK using a strictly defined initialization pattern (importing the JSON directly).
    *   **Security Middleware:** `src/middleware/firebaseAuth.js` enforces the presence and validity of a Firebase Bearer token for all protected routes, dropping unauthorized traffic immediately.
    *   **REST Routes:**
        *   `POST /api/v1/auth/sync`: Upserts authenticated Firebase users into the primary Postgres `users` table.
        *   `GET /api/v1/users/me`: Fetches user profiles joined with their `user_mastery_snapshot`.
        *   `POST /api/v1/duels/request`: Initiates a pending duel.
        *   `POST /api/v1/duels/:id/accept`: Transitions a duel to active.
        *   `POST /api/v1/duels/:id/submit`: Validates answers against the database and logs to `duel_events`.
    *   **WebSockets (Real-time):** `src/index.js` mounts a `Socket.io` server. It handles `duel:join` and `duel:leave` room logic, and emits `duel:answer_submitted` events to all active players when answers are successfully validated in the REST route.

## 5. Next Immediate Action Items (For the User)

To bring the entire stack fully online, the following manual environment steps must be taken:

1.  **Database Provisioning:** Stand up a PostgreSQL instance and run the four migration files in `/db/migrations`.
2.  **Firebase Provisioning:** Create a Firebase project, enable Authentication, and download the Service Account JSON into `/backend`.
3.  **Environment Variables:** Populate `/backend/.env` with the Database URL and Firebase paths.
4.  **Start Services:** Run `npm run dev` in both the `/frontend` and `/backend` directories simultaneously.
5.  **Frontend Wiring (Next Development Phase):** Update the UI components in `/frontend/src/App.jsx` to replace their `useState` dummy data with active `fetch` / `axios` calls pointing to the newly running `/api` routes.
