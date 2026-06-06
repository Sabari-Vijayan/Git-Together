# Git-Together — System Architecture Blueprint

> **Real-time GitHub networking game for tech onboarding events.**
> Stack: React/Vite · Supabase (Postgres + Realtime + Edge Functions) · GitHub OAuth

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Room State Machine](#2-room-state-machine)
3. [Database Schema Overview](#3-database-schema-overview)
4. [Scoring Formula](#4-scoring-formula)
5. [Data Flow: User Joins a Room](#5-data-flow-user-joins-a-room)
6. [Data Flow: Follow Action (Critical Path)](#6-data-flow-follow-action-critical-path)
7. [Background GitHub Sync Queue](#7-background-github-sync-queue)
8. [Row Level Security Model](#8-row-level-security-model)
9. [Realtime Subscription Map](#9-realtime-subscription-map)
10. [Frontend Component Map](#10-frontend-component-map)
11. [Environment Variables](#11-environment-variables)
12. [SQL Files Reference](#12-sql-files-reference)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  React/Vite SPA  ·  Mobile-first  ·  Monochrome UI             │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Auth    │  │  Room Lobby  │  │  Live Leaderboard        │  │
│  │  GitHub  │  │  QR Scanner  │  │  (Realtime subscription) │  │
│  │  OAuth   │  │  Profile     │  │                          │  │
│  └────┬─────┘  └──────┬───────┘  └──────────┬───────────────┘  │
└───────┼───────────────┼───────────────────────┼─────────────────┘
        │               │                       │
        ▼               ▼                       ▼ (Realtime WS)
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE PLATFORM                            │
│                                                                 │
│  ┌─────────────┐   ┌──────────────────────────────────────┐    │
│  │  Auth       │   │  PostgreSQL Database                 │    │
│  │  (GitHub    │   │                                      │    │
│  │   OAuth)    │   │  Tables: rooms, room_participants,   │    │
│  └─────────────┘   │          follow_ledger, profiles     │    │
│                    │                                      │    │
│  ┌─────────────┐   │  Triggers: score recalc on ledger   │    │
│  │  Realtime   │◄──│  insert, room state transitions     │    │
│  │  (Broadcast │   │                                      │    │
│  │   Changes)  │   │  RLS: enforced per-user, per-room   │    │
│  └─────────────┘   │  state policies                     │    │
│                    └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Edge Functions                                          │  │
│  │                                                          │  │
│  │  • github-sync-worker  (cron every 30s)                 │  │
│  │    – Ingests unsynced follow_ledger rows                 │  │
│  │    – Calls GitHub PUT /user/following/{username}         │  │
│  │    – Throttles to ≤ 30 req/min per OAuth token          │  │
│  │    – Marks rows synced or failed                        │  │
│  │                                                          │  │
│  │  • room-state-manager  (HTTP, called by client/cron)    │  │
│  │    – Transitions room: waiting → active → concluded     │  │
│  │    – Sets baseline snapshots for all participants        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼ (PUT /user/following/{username})
┌──────────────────┐
│   GitHub API     │
│  (Rate-limited)  │
│  5000 req/hr     │
│  authed user     │
└──────────────────┘
```

---

## 2. Room State Machine

```
          ┌─────────────────────────────────────────────┐
          │              ROOM STATES                    │
          └─────────────────────────────────────────────┘

   CREATE ROOM
        │
        ▼
  ┌───────────┐   organizer starts game       ┌──────────┐
  │  waiting  │ ─────────────────────────────►│  active  │
  │           │   (snapshots baseline stats)  │          │
  │ • Players │                               │ • Timer  │
  │   join    │                               │   ticks  │
  │ • QR codes│                               │ • Follow │
  │   visible │                               │   ledger │
  │ • No score│                               │   open   │
  └───────────┘                               │ • Live LB│
                                              └────┬─────┘
                                                   │
                                          timer reaches 0
                                          (or organizer ends)
                                                   │
                                                   ▼
                                           ┌────────────┐
                                           │ concluded  │
                                           │            │
                                           │ • Scores   │
                                           │   frozen   │
                                           │ • Final    │
                                           │   podium   │
                                           │ • No new   │
                                           │   follows  │
                                           └────────────┘

  State stored in: rooms.status (enum)
  Transitions enforced by: RLS policies + Edge Function room-state-manager
```

---

## 3. Database Schema Overview

```
┌─────────────────────┐         ┌──────────────────────────────┐
│      profiles       │         │           rooms              │
├─────────────────────┤         ├──────────────────────────────┤
│ id (FK auth.users)  │         │ id (uuid PK)                 │
│ github_username     │         │ organizer_id (FK profiles)   │
│ github_node_id      │         │ status (enum)                │
│ avatar_url          │         │ duration_seconds             │
│ display_name        │         │ started_at                   │
│ provider_token      │◄─────┐  │ ends_at (computed)           │
│ provider_refresh_tk │      │  │ created_at                   │
│ github_followers    │      │  │ room_code (unique, 6-char)   │
│ github_following    │      │  └──────────────────────────────┘
│ updated_at          │      │            │
└─────────────────────┘      │            │ 1:many
                             │            ▼
                             │  ┌──────────────────────────────┐
                             │  │     room_participants        │
                             │  ├──────────────────────────────┤
                             │  │ id (uuid PK)                 │
                             └──┤ user_id (FK profiles)        │
                                │ room_id (FK rooms)           │
                                │ baseline_followers           │
                                │ baseline_following           │
                                │ current_followers            │
                                │ current_following            │
                                │ score (computed by trigger)  │
                                │ joined_at                    │
                                └──────────────────────────────┘
                                             │
                                             │ 1:many
                                             ▼
                                ┌──────────────────────────────┐
                                │       follow_ledger          │
                                ├──────────────────────────────┤
                                │ id (uuid PK)                 │
                                │ room_id (FK rooms)           │
                                │ follower_id (FK profiles)    │
                                │ followee_id (FK profiles)    │
                                │ sync_status (enum)           │
                                │ sync_attempts                │
                                │ synced_at                    │
                                │ created_at                   │
                                └──────────────────────────────┘
```

---

## 4. Scoring Formula

```
Score = Δ Followers − (0.5 × Δ Following)

Where:
  Δ Followers = current_followers − baseline_followers
  Δ Following = current_following − baseline_following

  baseline_* = values snapshotted at moment room transitions to 'active'
  current_*  = incremented by triggers on follow_ledger inserts

Scoring intent:
  • Getting followed by many peers (+positive) = rewarded
  • Following many peers yourself (−half penalty) = gently discouraged
  • Net result: participants WANT to be found and followed
  • But following back is NOT catastrophic — only a 0.5x penalty
  • Deadlock broken: refusing to follow anyone = missed mutual follow opportunities
```

---

## 5. Data Flow: User Joins a Room

```
  User scans QR / enters room_code
           │
           ▼
  Client calls Supabase Auth
  (GitHub OAuth flow)
           │
           ▼
  auth.users row created/updated
  AFTER INSERT trigger fires ──────────────────────────────────────┐
  → upserts profiles row                                           │
  → stores provider_token (for GitHub API calls later)            │
           │                                                       │
           ▼                                                       │
  Client calls: INSERT INTO room_participants                      │
    (user_id, room_id)                                             │
           │                                                       │
           ▼                                                       │
  RLS CHECK: room.status = 'waiting'? ──── NO ──► 403 Reject      │
           │ YES                                                   │
           ▼                                                       │
  Row inserted with baseline_followers = 0,                       │
  baseline_following = 0  (will be snapshotted when active)       │
           │                                                       │
           ▼                                                       ▼
  Realtime BROADCAST ──────────────────────────────────────► All clients
  channel: room:{room_id}                                  in room see
  event: participant_joined                                new participant
  payload: { user_id, github_username, avatar_url }        appear in lobby
```

---

## 6. Data Flow: Follow Action (Critical Path)

```
  ┌─────────────────────────────────────────────────────────┐
  │  PHASE 1: Instant In-App Feedback (< 50ms)              │
  └─────────────────────────────────────────────────────────┘

  User taps "Follow" on peer's profile card
           │
           ▼
  Client: INSERT INTO follow_ledger
    { room_id, follower_id, followee_id, sync_status: 'pending' }
           │
           ▼
  RLS CHECK (all must pass):
    ✓ follower_id = auth.uid()           (can only log own actions)
    ✓ room.status = 'active'             (game must be running)
    ✓ ends_at > now()                    (timer not expired)
    ✓ UNIQUE(room_id, follower, followee) (no duplicate follows)
           │
           ▼
  ┌─────────────────────────────────────────────┐
  │  PostgreSQL TRIGGER fires (AFTER INSERT)    │
  │  Function: handle_follow_ledger_insert()    │
  │                                             │
  │  1. UPDATE room_participants                │
  │     SET current_following = current_following + 1  │
  │     WHERE user_id = NEW.follower_id         │
  │       AND room_id = NEW.room_id             │
  │                                             │
  │  2. UPDATE room_participants                │
  │     SET current_followers = current_followers + 1  │
  │     WHERE user_id = NEW.followee_id         │
  │       AND room_id = NEW.room_id             │
  │                                             │
  │  3. Recalculate scores for BOTH users:      │
  │     score = (current_followers - baseline_followers) │
  │           - 0.5 * (current_following - baseline_following) │
  └─────────────────────────────────────────────┘
           │
           ▼
  Supabase Realtime detects UPDATE on room_participants
           │
           ▼
  BROADCAST to channel: room:{room_id}
           │
           ▼
  All connected clients receive updated scores ──► Leaderboard re-renders


  ┌─────────────────────────────────────────────────────────┐
  │  PHASE 2: Background GitHub Sync (async, decoupled)     │
  └─────────────────────────────────────────────────────────┘

  (See Section 7 below)
```

---

## 7. Background GitHub Sync Queue

```
  ┌─────────────────────────────────────────────────────────────┐
  │         SUPABASE EDGE FUNCTION: github-sync-worker          │
  │         Triggered: pg_cron every 30 seconds                 │
  └─────────────────────────────────────────────────────────────┘

  STEP 1: Claim a batch of pending rows
  ─────────────────────────────────────
  UPDATE follow_ledger
  SET    sync_status = 'processing'
  WHERE  sync_status = 'pending'
    AND  sync_attempts < 3
  RETURNING id, follower_id, followee_id
  LIMIT  50                               ← throttle batch size

  (Uses FOR UPDATE SKIP LOCKED to be safe under concurrent runs)

  STEP 2: Group by follower_id
  ────────────────────────────
  For each unique follower_id in batch:
    • Fetch provider_token from profiles WHERE id = follower_id
    • Fetch github_username of followee  WHERE id = followee_id

  STEP 3: GitHub API Calls (throttled)
  ─────────────────────────────────────
  For each ledger_row in group:
    │
    ├── PUT https://api.github.com/user/following/{followee_username}
    │   Headers: Authorization: Bearer {follower.provider_token}
    │            X-GitHub-Api-Version: 2022-11-28
    │
    ├── Response 204 ──► Mark sync_status = 'synced', synced_at = now()
    │
    ├── Response 401 ──► Token expired
    │   └── Attempt token refresh via GitHub OAuth refresh flow
    │       ├── Success: update provider_token, retry call
    │       └── Fail:    sync_status = 'failed', log error
    │
    ├── Response 403/429 ──► Rate limit hit
    │   └── sync_status = 'pending' (back to queue)
    │       Wait for next cron cycle
    │
    └── Response 5xx ──► sync_attempts++, back to 'pending'
                         After 3 attempts: sync_status = 'failed'

  STEP 4: Delay between requests
  ───────────────────────────────
  await sleep(100ms) between each API call per token
  → Max ~10 GitHub calls/second per token
  → Well within GitHub's 5000 req/hour authenticated limit

  STEP 5: Update sync metadata
  ─────────────────────────────
  UPDATE follow_ledger
  SET    sync_status = ?, synced_at = ?, sync_attempts = sync_attempts + 1
  WHERE  id = ?


  Sync Status State Machine:
  ──────────────────────────
  pending ──► processing ──► synced
                          └──► failed  (after 3 attempts)
                          └──► pending (rate limited, retry next cycle)
```

---

## 8. Row Level Security Model

```
TABLE: profiles
  SELECT  → authenticated users can read all profiles (for displaying cards)
  INSERT  → handled by trigger only (not direct client insert)
  UPDATE  → user can only update their own row
  DELETE  → disabled

TABLE: rooms
  SELECT  → any authenticated user can read rooms (to join by code)
  INSERT  → any authenticated user (becomes organizer)
  UPDATE  → only organizer can update their own room
  DELETE  → only organizer

TABLE: room_participants
  SELECT  → any participant in the same room
  INSERT  → authenticated user, only for themselves,
            only when room.status = 'waiting'
  UPDATE  → trigger only (score updates) — client cannot UPDATE directly
  DELETE  → disabled

TABLE: follow_ledger
  SELECT  → participants in same room can see all ledger entries
  INSERT  → authenticated user, follower_id must equal auth.uid(),
            room must be 'active', ends_at must be in the future,
            UNIQUE constraint prevents duplicate follows
  UPDATE  → edge function service role only (sync_status updates)
  DELETE  → disabled (immutable audit log)
```

---

## 9. Realtime Subscription Map

```
  Channel: room:{room_id}
  ┌──────────────────────────────────────────────────────────┐
  │  Event Source              │  Payload                    │
  ├──────────────────────────────────────────────────────────┤
  │  rooms UPDATE              │  status, ends_at            │
  │  (state transitions)       │  → drives UI state machine  │
  ├──────────────────────────────────────────────────────────┤
  │  room_participants INSERT  │  user_id, github_username,  │
  │  (new player joined)       │  avatar_url                 │
  │                            │  → adds card to lobby       │
  ├──────────────────────────────────────────────────────────┤
  │  room_participants UPDATE  │  score, current_followers,  │
  │  (score changed by trigger)│  current_following          │
  │                            │  → re-sorts leaderboard     │
  └──────────────────────────────────────────────────────────┘

  All clients subscribe on mount:
    supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public',
          table: 'rooms', filter: `id=eq.${roomId}` }, handler)
      .on('postgres_changes', { event: '*', schema: 'public',
          table: 'room_participants', filter: `room_id=eq.${roomId}` }, handler)
      .subscribe()
```

---

## 10. Frontend Component Map

```
  App
  ├── AuthGate          (GitHub OAuth, persist session)
  ├── HomeScreen        (Create room / Join by code)
  │
  ├── RoomPage          (top-level, subscribes to Realtime)
  │   │
  │   ├── [status=waiting]
  │   │   ├── WaitingLobby
  │   │   │   ├── ParticipantGrid    (avatar cards)
  │   │   │   ├── MyQRCode           (encodes in-app profile URL)
  │   │   │   └── OrganizerControls  (Start Game button)
  │   │
  │   ├── [status=active]
  │   │   ├── ActiveHeader           (countdown timer)
  │   │   ├── Leaderboard            (real-time sorted list)
  │   │   ├── PeerScanner            (QR scan → profile modal)
  │   │   └── ProfileModal
  │   │       ├── GitHubStats
  │   │       └── FollowButton       (writes to follow_ledger)
  │   │
  │   └── [status=concluded]
  │       └── PodiumScreen           (top 3 + full rankings)
  │
  └── ProfilePage       (shareable, scannable per-user page)
      ├── AvatarHeader
      ├── GitHubStats
      └── FollowButton
```

---

## 11. Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# GitHub OAuth (configured in Supabase Auth dashboard)
# GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET set in Supabase dashboard
# NOT in frontend env

# Edge Functions (set in Supabase Edge Function secrets)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GITHUB_API_VERSION=2022-11-28
SYNC_BATCH_SIZE=50
SYNC_DELAY_MS=100
```

---

## 12. SQL Files Reference

| File | Purpose |
|------|---------|
| `sql/01_schema.sql` | All table DDL, types, indexes |
| `sql/02_triggers.sql` | Score computation trigger functions |
| `sql/03_rls.sql` | All Row Level Security policies |
| `sql/04_cron.sql` | pg_cron setup for sync worker |
| `sql/05_seed.sql` | Optional test data |

**Execution order matters.** Run files in numbered sequence in the Supabase SQL Editor.
