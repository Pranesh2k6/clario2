# Clario Backend

Express.js API server with Firebase Authentication and PostgreSQL.

## Prerequisites

Before running the server for the first time, complete these steps:

### 1. Firebase Setup
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Email/Password** and/or **Google** as Sign-in Providers under `Authentication > Sign-in method`.
3. Generate a **Service Account Key**: `Project Settings > Service Accounts > Generate new private key`.
4. Save the downloaded `.json` file as `firebase-service-account.json` in the root of this `/backend` directory.

### 2. Environment Configuration
Copy the example environment file and fill in your values:
```
cp .env.example .env
```

Update `.env` with:
- `DATABASE_URL` → Your PostgreSQL connection string.
- `FIREBASE_SERVICE_ACCOUNT_PATH` → `./firebase-service-account.json`

### 3. Database Migrations
Run the SQL migration files in order against your PostgreSQL instance:
```
psql $DATABASE_URL -f ../db/migrations/001_primary_users_and_xp.sql
psql $DATABASE_URL -f ../db/migrations/002_primary_content_taxonomy.sql
psql $DATABASE_URL -f ../db/migrations/003_primary_duels_and_gamification.sql
```

## Running Locally

```bash
npm run dev
```

Server starts on `http://localhost:3000`.
The Vite frontend proxies all `/api` requests automatically — no CORS configuration needed.

## API Endpoints

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | Health check |
| `POST` | `/api/v1/auth/sync` | Firebase Token | Upserts user into Postgres after login |
| `GET` | `/api/v1/users/me` | Firebase Token | Returns user profile + XP snapshot |
| `POST` | `/api/v1/duels/request` | Firebase Token | Creates a pending duel challenge |
| `POST` | `/api/v1/duels/:id/accept` | Firebase Token | Accepts a pending challenge |
| `POST` | `/api/v1/duels/:id/submit` | Firebase Token | Submits an answer during a live duel |

## WebSocket Events (Socket.io)

| Event (Client → Server) | Payload | Description |
| :--- | :--- | :--- |
| `duel:join` | `{ duelId }` | Join a duel room |
| `duel:leave` | `{ duelId }` | Leave a duel room |

| Event (Server → Client) | Payload | Description |
| :--- | :--- | :--- |
| `duel:accepted` | `{ duel }` | Broadcast when a duel is accepted |
| `duel:opponent_joined` | `{ socketId }` | Notifies when the other player connects |
| `duel:answer_submitted` | `{ playerId, questionId, isCorrect }` | Broadcasts after an answer is logged |
