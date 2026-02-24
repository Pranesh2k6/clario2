# 01 - Comprehensive Database Architecture Implementation Plan

Date: 2026-02-23
Topic: Full-Stack Database Schema & Infrastructure Implementation Plan
Location: `docs/implementation/01-database-schema-plan.md`

**Skills Utilized**:
- `/Users/praneshjs/Education/Clario3/.agent/skills/supabase-postgres-best-practices/SKILL.md`

---

## Executive Overview
This document serves as the authoritative implementation blueprint for Clario's database infrastructure. It translates the finalized architectural directives into concrete schema definitions, infrastructure configurations, and structural patterns. This plan covers the Primary PostgreSQL Cluster, the Telemetry PostgreSQL Cluster, the Redis Acceleration Layer, and connection pooling requirements.

---

## Phase 1: Infrastructure & Configuration

### 1.1 Connection Pooling (PgBouncer)
To protect both PostgreSQL clusters from connection starvation during high concurrent loads (e.g., nationwide quizzes), connection pooling is mandatory.
*   **Implementation:** Deploy PgBouncer (or Supavisor if using the Supabase ecosystem).
*   **Mode:** `Transaction Pooling` (ensures connections are returned to the pool immediately after the transaction commits, rather than waiting for the client disconnect).
*   **Target:** Limit maximum actual connections to PostgreSQL to a stable number (e.g., 200-500 depending on instance size), while allowing the pooler to queue thousands of incoming client requests.

### 1.2 Automated Partitioning (pg_partman)
Time-series data requires automated partition management to prevent operational disasters at the end of every month.
*   **Implementation:** Install the `pg_partman` extension on both Primary and Telemetry clusters.
*   **Configuration:** Configure a background worker (`pg_cron`) to invoke `partman.run_maintenance()` nightly. This ensures the next month's partitions are automatically created ahead of time.

---

## Phase 2: Primary PostgreSQL Cluster (Business Truth)

This cluster exclusively handles authoritative transactional data, relationships, and user state.

### 2.1 Identity & Master State
```sql
-- Core User Identity
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Progress Snapshot (Updated asynchronously via trigger/cron)
-- NEVER incremented directly via application logic.
CREATE TABLE user_mastery_snapshot (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_level INT DEFAULT 1,
    cached_total_xp BIGINT DEFAULT 0,
    concept_debt_score FLOAT DEFAULT 0.0,
    last_recalculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 The XP Ledger (Immutable & Partitioned)
```sql
-- Partitioned Ledger Table
CREATE TABLE xp_ledger_events (
    id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    amount INT NOT NULL, -- (+/- values)
    source_type VARCHAR(50) NOT NULL, -- e.g., 'duel_win', 'chapter_complete'
    source_id UUID NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Example Partition (pg_partman will generate these automatically)
-- CREATE TABLE xp_ledger_events_y2026m02 PARTITION OF xp_ledger_events ...
```
***Implementation Note:*** Create a database trigger that fires on `INSERT INTO xp_ledger_events`. The trigger should dispatch a job or safely `UPDATE user_mastery_snapshot SET cached_total_xp = cached_total_xp + NEW.amount` to keep the cache warm without locking the core `users` table.

### 2.3 Content Taxonomy
```sql
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT NOT NULL
);

CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    order_index INT NOT NULL
);

CREATE TABLE concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content JSONB NOT NULL, -- Text, Images, Video URLs, Options
    correct_answer_index INT NOT NULL,
    difficulty_weight FLOAT NOT NULL DEFAULT 1.0,
    algorithmic_hints JSONB -- Arbitrary hint generation logic/data
);

-- Many-to-Many Concept Tagging (Vital for Adaptive Engine)
CREATE TABLE question_concept_tags (
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (question_id, concept_id)
);
```

### 2.4 Duel Authority
```sql
CREATE TABLE duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_1_id UUID REFERENCES users(id),
    player_2_id UUID REFERENCES users(id),
    winner_id UUID NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, completed, cancelled
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
```

---

## Phase 3: Telemetry PostgreSQL Cluster (High-Volume Logging)

This separate cluster protects the Primary database from I/O exhaustion caused by millions of micro-learning events.

```sql
-- Partitioned Attempt History
CREATE TABLE attempt_history (
    id UUID NOT NULL,
    user_id UUID NOT NULL, -- No FK constraint here as users live on Primary DB
    question_id UUID NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken_ms INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partitioned Hint & Interaction Logs
CREATE TABLE interaction_logs (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    session_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- e.g., 'hint_opened', 'video_paused', 'slider_adjusted'
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
```
***Implementation Note:*** Analytics dashboards that need to join User data (Primary DB) with Telemetry data (Telemetry DB) will utilize logical replication or ETL jobs pushing data to the eventual ClickHouse OLAP cluster.

---

## Phase 4: Redis Caching & ephemeral State Layer

Redis acts strictly as the speed accelerator and state buffer. It is implemented purely through the application backend layer (Node.js/Go) connecting via `ioredis` or similar.

### 4.1 Redis Key/Value Schema Plan

| Namespace / Key Pattern | Data Structure | Purpose | TTL |
| :--- | :--- | :--- | :--- |
| `rate_limit:api:{ip}` | INT (Counter) | Protection against API spam | 60 seconds |
| `leaderboard:global:daily` | ZSET (Sorted Set) | Lightning fast leaderboard reads using player XP as the score | End of Day |
| `cache:question:{q_id}` | STRING (JSON) | Caching frequently hit questions to bypass Postgres | 24 Hours |
| `duel:{duel_id}:state` | HASH | Live tracking of current question, active players, and millisecond timers. | 1 Hour (Drops when duel ends) |

### 4.2 Redis Pub/Sub Broadcast Channels
*   **Channel:** `duel_stream:{duel_id}`
    *   *Usage:* Backend validates an answer, updates the Redis state HASH, and publishes a JSON payload to this channel. Connected WebSockets receive and push to clients.
*   **Channel:** `global_announcements`
    *   *Usage:* Server pushing "Player X just reached Diamond Tier!" across the platform.

---

## Summary of Delivery

By following this exact schema and infrastructure setup:
1.  **XP is uncorruptible.** (Stored in an append-only, partitioned ledger).
2.  **Reads are lightning-fast.** (Leaderboards and Questions are cached in Redis).
3.  **Writes are protected.** (PgBouncer stops connection storms; Telemetry is physically separated from Primary).
4.  **Real-time is scalable.** (Duel state lives ephemerally in Redis until completion, at which point the final audit is written to Postgres).
