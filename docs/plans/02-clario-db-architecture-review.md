# 02 - Clario Database Architecture — Final Refinement Directives

Date: 2026-02-23
Topic: Final Refinement Database Architecture Directives

**Skills Utilized:**
- `/Users/praneshjs/Education/Clario3/.agent/skills/supabase-postgres-best-practices/SKILL.md`

This document outlines the finalized Clario database architecture directives for long-term scalability, transactional integrity, and operational stability.

---

## 1. Partitioning Strategy (Mandatory from Day One)

The following tables must be partitioned by time (e.g., monthly):
- `xp_events` (XP ledger)
- `duel_events`
- `attempt_history`
- `hint_usage_events`

**Rationale:**
- Prevents index bloat.
- Improves autovacuum performance.
- Reduces query scan range significantly.
- Enables efficient archival of old data.
- Avoids catastrophic migrations when scaling later.
- *Requirement:* Partition maintenance must be automated (e.g., using `pg_partman` to pre-create future partitions).

---

## 2. Strict Workload Isolation at Scale

At ~100K active users or sustained high write throughput, split into two distinct PostgreSQL clusters to ensure transactional health:

**Primary Cluster (Business & Truth):**
- System Users
- XP Ledger
- Concept Debt
- Content Hierarchy
- Duel State
- Schedules

**Telemetry Cluster (High Volume Logging):**
- Attempt History
- Hint Logs
- Adaptive Engine Signals
- Performance Metrics

**Rationale:**
Telemetry writes (high-volume, low-value) must never compete with transactional XP updates (low-volume, high-value) for disk I/O or connection pools.

---

## 3. XP Ledger Design Principles (ACID First)

- **Insert-Only Ledger Model:** Never mutate totals directly.
- **No Direct Mutation:** Avoid `UPDATE users SET xp = xp + 10`.
- **Snapshot Buffering:** Maintain a separate snapshot table for cached totals.
- **Idempotency:** Unique idempotency keys required for all XP events to prevent double-charging.
- **Strict Writes:** Rely heavily on PostgreSQL's transactional guarantees.

**Rationale:**
XP is the currency of Clario. It behaves exactly like financial value, requiring ironclad, auditable integrity.

---

## 4. Redis Scope Discipline

**Redis should handle:**
- Active duel session state
- Rate limiting / Throttling
- Top leaderboard caching
- Pub/Sub fan-out messaging
- Temporary session snapshots

**Redis must NOT:**
- Store authoritative or final XP amounts
- Store persistent mastery state or concept debt
- Replace PostgreSQL's transactional guarantees

**Rationale:**
Redis is built for acceleration and ephemeral state buffering, not underlying truth.

---

## 5. Realtime Layer Strategy

**For MVP:**
- Use a managed realtime solution that leverages Postgres `LISTEN/NOTIFY` directly (e.g., Supabase Realtime).

**For Scale (Millions of Users):**
- Transition to a dedicated, custom WebSocket layer backed by a Redis cluster to handle massive connection fan-out.

**System Rules:**
- The realtime system must never be the source of truth.
- It must only broadcast state that has been safely derived/committed to PostgreSQL first.

---

## 6. Read Replica Usage

**Read replicas should serve:**
- Leaderboard generation
- Analytics dashboards
- Content browsing / Question rendering
- Study history queries

**System Rules:**
- Transactional writes (XP gains, purchases) must *never* depend on reading replica state first.
- Replica replication lag tolerance (even if milliseconds) must be explicitly considered and handled gracefully in the UX design.

---

## 7. Vacuum, Index, and Bloat Management
*(Aligned perfectly with Supabase Postgres Best Practices)*

- Actively monitor index growth exclusively on partitioned tables.
- **Avoid** excessive multi-column indexes unless queries explicitly use all columns frequently.
- **Embrace** partial indexes (`WHERE status = 'active'`) to save space/RAM.
- Track autovacuum performance early via `pg_stat_user_tables`.
- Plan explicit retention/dropping policies for old telemetry data partitions.

---

## 8. ClickHouse Introduction (Deferred)

Introduce ClickHouse **only** when:
- Complex analytical queries begin running slow on PostgreSQL read replicas.
- ML feature extraction heavily requires scanning billions of rows across multiple time dimensions.
- Cohort slicing operations begin impacting the performance of the primary database.

*Until this threshold is met, PostgreSQL Read Replicas are highly capable of handling intermediate analytical workloads.*

---

## 9. Connection Pooling

**PgBouncer** (or an equivalent like Supavisor) must be implemented early.

**Targets:**
- Sustain high user concurrency.
- Control maximum DB connection counts strictly.
- Provide baseline protection against connection starvation and startup storms.

---

## 10. Principle of Separation: The Final Philosophy

**The Tech Mappings:**
- **PostgreSQL:** Truth + Transactions (The Backbone)
- **Redis:** Speed + State Buffer (The Accelerator)
- **Realtime Layer:** Broadcast (The Megaphone)
- **Telemetry DB (PostgreSQL Partitioned):** High-volume signals (The Listener)
- **ClickHouse:** Deep Analytics (The Future Brain)

This exact structural philosophy is designed to smoothly scale **Clario** from an MVP → to 100K users → up to 5M+ institutional scale without requiring a rewrite of the core system paradigm.
