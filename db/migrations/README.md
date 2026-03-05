# Clario Database Migrations

This directory contains the SQL migration files for the Clario database architecture.

## Migration Order

Run these in strict numerical order. Each file is designed to be idempotent and safe.

| File | Cluster | Description |
| :--- | :--- | :--- |
| `001_primary_users_and_xp.sql` | **Primary** | Users, Mastery Snapshot, XP Ledger (partitioned), XP snapshot trigger |
| `002_primary_content_taxonomy.sql` | **Primary** | Subjects, Chapters, Concepts, Questions, Question-Concept tags, Chapter Notes |
| `003_primary_duels_and_gamification.sql` | **Primary** | Duels, Duel Events (partitioned), Badges, Concept Debt, Study Schedules, Streaks |
| `004_telemetry_cluster.sql` | **Telemetry** | Attempt History, Interaction Logs, Adaptive Signals (all partitioned) |
| `005_analytics_schema_enhancements.sql` | **Both** | Analytics columns on `duel_questions_pool` + `attempt_history`, Knowledge Profiles, ELO Ratings, Recommendations, Daily Metrics |

## Cluster Separation

- **Primary Cluster** (`001`–`003`): Run against your primary PostgreSQL instance. Handles all transactional, authoritative data.
- **Telemetry Cluster** (`004`): Run against a **separate** PostgreSQL instance. Handles high-volume logging that must never compete with transactional workloads.
- **Analytics Schema** (`005`): Run against **both** clusters — some ALTER TABLEs target Primary (`duel_questions_pool`), others target Telemetry (`attempt_history`, new analytics tables).

> **For MVP**: Both clusters can temporarily share a single Postgres instance. Split them when sustained write throughput grows beyond capacity (~100K active users).

## Partitioning

All partitioned tables (marked in migration comments) ship with 8 months of initial partitions (Jan–Aug 2026). Use `pg_partman` to automate creation of future partitions beyond this window.

## Key Architectural Rules

1. **XP Ledger is immutable** — insert-only, never update/delete.
2. **`user_mastery_snapshot`** is auto-updated via a trigger on `xp_ledger_events` — never write to it from application code.
3. **Telemetry tables have no foreign keys** to Primary tables — this is intentional for cluster independence.
