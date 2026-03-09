# 🚀 Clario — AI-Powered Competitive Learning Platform

Clario is a full-stack, gamified learning platform built for JEE/NEET aspirants. It transforms traditional study into an interactive experience through **real-time PvP duels**, **adaptive quizzes**, **a galaxy-themed UI**, and a **machine-learning analytics engine** that tracks mastery, detects learning behaviors, and generates personalized study plans.

The project is a monorepo containing three main services: a **React frontend**, a **Node.js backend**, and a **Python analytics engine**, supported by PostgreSQL, Redis, and optional infrastructure for monitoring and experiment tracking.

---

## 📁 Project Structure

```
Clario3/
├── frontend/                # React + Vite + Tailwind CSS v4
├── backend/                 # Express.js API + Socket.io (Real-time)
├── analytics-engine/        # Python ML/Analytics microservice (FastAPI)
├── dataset/                 # Question bank (Physics, Chemistry, Maths)
├── db/
│   └── migrations/          # PostgreSQL schema migrations (001–008)
├── monitoring/              # Prometheus configuration
├── docs/                    # Architecture docs & implementation plans
├── docker-compose.yml       # Frontend + Backend containers
└── docker-compose.analytics.yml  # Analytics infra (Redis, TimescaleDB, etc.)
```

---

## 🧩 Modules

### 1. Frontend (`frontend/`)

A single-page React application with a space/galaxy-themed UI.

| Tech | Version |
| :--- | :--- |
| React | 18.3 |
| Vite | 6.3 |
| Tailwind CSS | 4.1 |
| React Router | 7.13 |
| Socket.io Client | 4.8 |
| Framer Motion | 12.x |
| Recharts | 2.15 |

**Key Pages (22 total):**

| Page | Route | Description |
| :--- | :--- | :--- |
| Auth | `/` | Login / Signup with Firebase |
| Dashboard | `/dashboard` | Main hub with stats & recommendations |
| Galaxy Map | `/galaxy` | Animated planet-based subject navigation |
| Subject Page | `/subject/:id` | Chapter listing for a subject |
| Chapter Detail | `/subject/:id/chapter/:id` | Learn, Quiz, Vectorfall modes |
| Learn Mode | `.../learn` | Concept learning with rich content |
| Adaptive Quiz | `.../quiz` | Difficulty-adapting question engine |
| Duels Lobby | `/duels` | Start or join PvP duels |
| Duel Match | `/duels/match` | Real-time duel gameplay |
| Duel Result | `/duels/result` | Post-match analysis with AI insights |
| Study Planner | `/planner` | AI-generated study schedule |

---

### 2. Backend (`backend/`)

A Node.js/Express REST API with real-time WebSocket support.

| Tech | Purpose |
| :--- | :--- |
| Express 5 | HTTP API framework |
| Firebase Admin | Authentication & user verification |
| PostgreSQL (pg) | Primary database |
| Socket.io | Real-time duel events |
| ioredis | Event streaming to ML engine |

**API Routes:**

| Prefix | Module | Endpoints |
| :--- | :--- | :--- |
| `/api/v1/auth` | `auth.js` | Signup, login, `GET /me` |
| `/api/v1/duels` | `duels.js` | Create, join, submit, forfeit, AI-match, random-match |
| `/api/v1/planner` | `planner.js` | Study plan CRUD, schedule generation |
| `/api/v1/analytics` | `analytics.js` | Dashboard, knowledge profile, weak topics, insights |
| `/api/health` | `index.js` | Health check (DB + Firebase status) |

**WebSocket Events:**

| Event | Direction | Description |
| :--- | :--- | :--- |
| `duel:join` | Client → Server | Join a duel room |
| `duel:answer_submitted` | Server → Room | Broadcast answer result |
| `duel:player_finished` | Server → Room | A player finished all questions |
| `duel:completed` | Server → Room | Both finished — final result |
| `duel:opponent_forfeited` | Server → Client | Opponent left the duel |

---

### 3. Analytics Engine (`analytics-engine/`)

A Python microservice providing ML-powered learning analytics.

| Tech | Purpose |
| :--- | :--- |
| FastAPI + Uvicorn | API server |
| scikit-learn | Clustering & feature extraction |
| TrueSkill | Bayesian skill rating |
| NumPy / SciPy | Numerical computation |
| MLFlow | Experiment tracking |
| Redis | Event consumption from backend |
| httpx | HTTP calls to Ollama (NLG) |

**ML Modules (18 files):**

| Module | Description |
| :--- | :--- |
| `bkt_engine.py` | Bayesian Knowledge Tracing — mastery probability |
| `irt_calibration.py` | Item Response Theory — question difficulty calibration |
| `elo_rating.py` | ELO rating system for duel matchmaking |
| `trueskill_rating.py` | Microsoft TrueSkill — advanced skill estimation |
| `skill_estimation.py` | Knowledge vector & weak/strong topic detection |
| `behavioral_analytics.py` | Classifies students: guessing, careful, mastery, etc. |
| `clustering.py` | K-Means clustering of learner profiles |
| `feature_extraction.py` | Extracts duel stats & daily metrics from DB |
| `mab_recommender.py` | Multi-Armed Bandit recommendation engine |
| `recommendation_engine.py` | Generates personalized study recommendations |
| `nlg_formatter.py` | Natural Language Generation (Ollama Llama 3.1) |
| `event_consumer.py` | Redis Streams consumer — processes live events |
| `pipeline.py` | Orchestrates the full analytics pipeline |
| `mlflow_tracking.py` | Logs model metrics to MLFlow |
| `api.py` | FastAPI endpoints |
| `config.py` | Environment & threshold configuration |
| `db.py` | Database connection management |

**Simulator (`analytics-engine/simulator/`):**

| Module | Description |
| :--- | :--- |
| `archetypes.py` | Defines student behavior archetypes for testing |
| `generate.py` | Generates synthetic attempt data for ML model evaluation |

---

### 4. Database (`db/migrations/`)

PostgreSQL schema managed via numbered SQL migrations.

| Migration | Tables |
| :--- | :--- |
| `001_primary_users_and_xp.sql` | `users`, `user_mastery_snapshot` |
| `002_primary_content_taxonomy.sql` | `subjects`, `chapters`, `topics` |
| `003_primary_duels_and_gamification.sql` | `duels`, `duel_events` |
| `004_duel_questions_pool.sql` | `duel_questions_pool` |
| `004_telemetry_cluster.sql` | `attempt_history`, `interaction_logs` |
| `005_analytics_schema_enhancements.sql` | `student_knowledge_profiles`, `student_skill_ratings`, `learning_recommendations`, `daily_learning_metrics` |
| `006_trueskill_columns.sql` | Adds TrueSkill mu/sigma columns |
| `007_irt_columns.sql` | Adds IRT discrimination/guessing columns |
| `008_mab_arm_stats.sql` | Adds MAB arm statistics |

---

### 5. Dataset (`dataset/`)

Pre-built question banks used for duel and quiz modes.

| File | Subject | Format |
| :--- | :--- | :--- |
| `physics.json` | Physics | JSON array |
| `chemistry.json` | Chemistry | JSON array |
| `maths.json` | Mathematics | JSON array |
| `combined.jsonl` | Mixed | JSON Lines |

---

## ⚙️ Prerequisites

Before setting up, ensure you have the following installed:

| Tool | Version | Required For |
| :--- | :--- | :--- |
| **Node.js** | ≥ 18.x | Frontend & Backend |
| **npm** or **pnpm** | Latest | Package management |
| **Python** | 3.9+ | Analytics Engine |
| **PostgreSQL** | ≥ 14 | Primary database |
| **Redis** | ≥ 7 | Event streaming |
| **Docker** *(optional)* | Latest | Containerized setup |
| **Firebase Project** | — | Authentication |

---

## 🛠️ Local Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Clario3
```

### Step 2: Set Up PostgreSQL

Create the database and run migrations in order:

```bash
# Create the database
createdb clario_primary

# Run all migrations sequentially
psql -d clario_primary -f db/migrations/001_primary_users_and_xp.sql
psql -d clario_primary -f db/migrations/002_primary_content_taxonomy.sql
psql -d clario_primary -f db/migrations/003_primary_duels_and_gamification.sql
psql -d clario_primary -f db/migrations/004_duel_questions_pool.sql
psql -d clario_primary -f db/migrations/004_telemetry_cluster.sql
psql -d clario_primary -f db/migrations/005_analytics_schema_enhancements.sql
psql -d clario_primary -f db/migrations/006_trueskill_columns.sql
psql -d clario_primary -f db/migrations/007_irt_columns.sql
psql -d clario_primary -f db/migrations/008_mab_arm_stats.sql
```

### Step 3: Set Up Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project (or use an existing one).
2. Enable **Authentication** → **Email/Password** sign-in method.
3. Download the **Service Account Key** JSON from Project Settings → Service Accounts.
4. Save it as `backend/firebase-service-account.json`.
5. Get your **Firebase Web Config** from Project Settings → General → Your Apps → Web App.

### Step 4: Set Up the Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env   # If .env.example exists, otherwise create manually
```

Create/edit `backend/.env` with the following variables:

```env
# Database
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/clario_primary

# Firebase
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Redis (for ML event streaming)
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
```

**Seed the question bank:**

```bash
node scripts/seedDuelQuestions.js
```

**Start the backend:**

```bash
# Development (with hot-reload)
npm run dev

# Production
npm start
```

The backend will be available at `http://localhost:3000`.

### Step 5: Set Up the Frontend

```bash
cd frontend

# Install dependencies
npm install
```

Create `frontend/.env` (if needed) to point the API client at the backend:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

> **Note:** Check `frontend/src/api/client.js` or `frontend/src/config/` for the exact variable name used.

**Start the frontend:**

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Step 6: Set Up the Analytics Engine *(optional)*

The analytics engine is optional for basic functionality but required for ML-powered insights, recommendations, and advanced duel analysis.

```bash
cd analytics-engine

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

Edit `analytics-engine/.env`:

```env
PRIMARY_DATABASE_URL=postgresql://your_user:your_password@localhost:5432/clario_primary
TELEMETRY_DATABASE_URL=postgresql://your_user:your_password@localhost:5432/clario_primary
REDIS_URL=redis://localhost:6379/0
API_HOST=0.0.0.0
API_PORT=8000
ELO_K_FACTOR=32
MIN_ATTEMPTS_THRESHOLD=10
```

**Start the analytics engine:**

```bash
python -m analytics.api
```

The analytics API will be available at `http://localhost:8000`.

---

## 🐳 Docker Setup *(Alternative)*

If you prefer containers, two Docker Compose files are provided:

**App containers (Frontend + Backend):**

```bash
docker-compose up -d --build
```

**Analytics infrastructure (Redis, TimescaleDB, ClickHouse, Ollama, MLFlow, Prometheus, Grafana):**

```bash
docker-compose -f docker-compose.analytics.yml up -d
```

**Pull the LLM model for NLG insights (first time only):**

```bash
docker exec clario_ollama ollama pull llama3.1:8b
```

### Service Ports (Docker)

| Service | Port | URL |
| :--- | :--- | :--- |
| Frontend | 5173 | `http://localhost:5173` |
| Backend | 3000 | `http://localhost:3000` |
| Analytics API | 8000 | `http://localhost:8000` |
| Redis | 6379 | — |
| TimescaleDB | 5433 | — |
| ClickHouse | 8123 / 9000 | `http://localhost:8123` |
| Ollama (LLM) | 11434 | `http://localhost:11434` |
| MLFlow | 5001 | `http://localhost:5001` |
| Prometheus | 9090 | `http://localhost:9090` |
| Grafana | 3001 | `http://localhost:3001` |

---

## 📋 Commands Reference

### Frontend

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build production bundle |

### Backend

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start with nodemon (auto-restart on change) |
| `npm start` | Start in production mode |
| `node scripts/seedDuelQuestions.js` | Seed question bank from `dataset/` |

### Analytics Engine

| Command | Description |
| :--- | :--- |
| `python -m analytics.api` | Start the FastAPI analytics server |
| `python -m analytics.event_consumer` | Start the Redis event consumer |
| `python -m analytics.pipeline` | Run the full analytics pipeline manually |
| `python -m simulator.generate` | Generate synthetic student data for testing |

### Docker

| Command | Description |
| :--- | :--- |
| `docker-compose up -d --build` | Start frontend + backend |
| `docker-compose -f docker-compose.analytics.yml up -d` | Start analytics infra |
| `docker-compose down` | Stop app containers |
| `docker-compose -f docker-compose.analytics.yml down` | Stop analytics infra |

---

## 🔐 Environment Variables Summary

### Backend (`backend/.env`)

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase service account JSON |
| `FRONTEND_URL` | Frontend origin for CORS |
| `REDIS_URL` | Redis connection string |
| `PORT` | Server port (default: 3000) |

### Analytics Engine (`analytics-engine/.env`)

| Variable | Description |
| :--- | :--- |
| `PRIMARY_DATABASE_URL` | Primary PostgreSQL connection |
| `TELEMETRY_DATABASE_URL` | Telemetry PostgreSQL connection |
| `TIMESCALE_DATABASE_URL` | TimescaleDB connection *(optional)* |
| `REDIS_URL` | Redis connection string |
| `API_HOST` | Analytics API host (default: `0.0.0.0`) |
| `API_PORT` | Analytics API port (default: `8000`) |
| `ELO_K_FACTOR` | ELO rating sensitivity (default: `32`) |
| `MIN_ATTEMPTS_THRESHOLD` | Min attempts before topic classification |

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│         Vite · Tailwind · Socket.io · Framer Motion         │
└───────────────┬───────────────────────────┬─────────────────┘
                │ REST API                  │ WebSocket
                ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Express)                       │
│       Firebase Auth · PostgreSQL · Redis Event Stream       │
└───────┬──────────────────────┬──────────────────┬───────────┘
        │ SQL                  │ Redis Streams     │ SQL
        ▼                      ▼                   ▼
┌──────────────┐   ┌────────────────────┐   ┌─────────────────┐
│  PostgreSQL  │   │   Redis            │   │  Analytics      │
│  (Primary)   │   │   (Event Bus)      │──▶│  Engine         │
│              │   └────────────────────┘   │  (Python)       │
│  • users     │                            │  • BKT          │
│  • duels     │◀───────────────────────────│  • IRT          │
│  • questions │     Writes profiles        │  • TrueSkill    │
│  • analytics │     & recommendations      │  • MAB          │
└──────────────┘                            │  • NLG          │
                                            └─────────────────┘
```

---

## 📝 License

ISC
