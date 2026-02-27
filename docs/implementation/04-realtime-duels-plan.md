# Realtime Duels (1v1) Implementation Plan

## Objective
Implement a fully functional 1v1 Realtime Duels feature where users can:
- Send a direct challenge to a friend via a Duel Code.
- Match instantly with a random opponent.
- Accept or decline pending duel requests.
- Start an AI Duel.
- Pre-select subjects before duel generation.
- Answer 10 real questions fetched from the DB (seeded from the Hugging Face dataset).
- Maintain the **exact existing UI design** of the `Duels.jsx` and `DuelMatch.jsx` components without altering DOM structures or styling classes.

---

## Agent Skills & Guidelines to Follow
Before and during execution, the following skills from the `.skills` directory must be strictly adhered to:
1.  **test-driven-development**: Write API tests before or alongside backend implementation.
2.  **systematic-debugging**: Use systematic console logging and network inspection to trace Socket.io events and DB updates.
3.  **verification-before-completion**: Manually verify the end-to-end duel flow (request -> match -> 10 questions -> result) works locally before considering the task done.
4.  **UI Preservation Rule (User Request)**: ANY new DOM object created must strictly match the current UI design. Existing Tailwind classes and `motion` components must be preserved exactly as they are.

---

## Phase 1: Backend API Enhancements
We need to extend `backend/src/routes/duels.js` and `backend/src/index.js` (Socket.io).

### 1.1 Database Helper Functions
- Create a helper to fetch 10 random questions from the structured `questions` table based on an array of `subject_ids`.

### 1.2 REST Endpoints (`/api/v1/duels`)
1.  **`POST /request` (Update)**: Modify to accept `subjects` (array) along with `targetUserId`.
2.  **`POST /random-match` (New)**:
    - Add user to a Redis waiting pool or a new Postgres `matchmaking_queue` table.
    - If another user is waiting, pop them, create a `duel` record with 10 pre-selected questions, and return the `duelId`.
3.  **`POST /ai-match` (New)**:
    - Create a duel record where `player_2_id` is a system-generated AI user UUID.
    - Fetch 10 questions.
4.  **`GET /pending` (New)**:
    - Fetch duels where `player_2_id = req.user.uid` and `status = 'pending'`.
    - Join with the `users` table to get challenger details (username, xp).
5.  **`GET /:id` (New)**:
    - Fetch the active duel state, including the 10 selected questions (without the correct answers attached to prevent cheating).
6.  **`GET /recent-activity` (New)**:
    - Fetch the user's total duels, win rate, and leaderboard rank from the DB.

### 1.3 Real-time Socket.io Events (`backend/src/index.js`)
- `duel:join_queue`: User joins random matchmaking.
- `duel:match_found`: Server broadcasts to both players when `/random-match` pairs them.
- `duel:challenge_received`: Server notifies a specific user when someone targets them via `/request`.
- `duel:question_tick`: Server-managed timer (e.g., 60 seconds per question) to ensure both clients stay synced.
- `duel:answer_submitted`: Already implemented, but needs logic to check if both players answered to push the next question.
- `duel:completed`: Emitted when all 10 questions are answered, calculating the final winner.

---

## Phase 2: Frontend Integration
Modify `frontend/src/pages/Duels.jsx` and related match pages. **Strictly preserve all Tailwind CSS and `motion` structures.**

### 2.1 API Client & Socket Integration
- Update `api/socket.js` to handle the new events (`duel:match_found`, `duel:challenge_received`, `duel:question_tick`).

### 2.2 Duels Dashboard (`Duels.jsx`)
1.  **Activity Panel**: Call `GET /api/v1/duels/recent-activity` on mount and replace hardcoded "47", "68%", "#142".
2.  **Pending Challenges**: 
    - Call `GET /api/v1/duels/pending`.
    - Map over the existing `pendingChallenges` UI structure.
    - Wire up the `CheckCircle` (Accept -> `POST /:id/accept`) and `X` (Decline) buttons.
3.  **Friend Duel**:
    - Add a "Subject Selection" dropdown or toggle matching the UI aesthetic.
    - Wire "Join Duel" button to `POST /api/v1/duels/request`.
4.  **Random Match**: 
    - Wire "Find Match" to emit `duel:join_queue`. Handle loading state on the button.
5.  **AI Duel**:
    - Wire "Start AI Duel" to `POST /api/v1/duels/ai-match`.

### 2.3 Duel Match Interface (`DuelMatch.jsx`)
1.  **Pre-loading**: Before starting the timer, preload the 10 HuggingFace CDN image URLs locally.
2.  **State Management**: Track `currentQuestionIndex`, `playerScore`, `opponentScore`, `timeLeft`.
3.  **Real-time Sync**: Listen to `duel:question_tick` to update the progress bar.
4.  **Answer Submission**: When clicking an option, call `POST /:id/submit`. Show immediate local positive/negative feedback, but wait for `duel:next_question` to proceed.

---

## Phase 3: Verification & Edge Cases
1.  **Disconnections**: Handle `disconnect` events in Socket.io. If a player drops, auto-forfeit them after a 10-second grace period.
2.  **Image Loading**: Ensure CDN images don't cause layout shift in the exact UI.
3.  **Security**: Ensure `correct_answer_index` is NEVER sent to the frontend until the round ends.
