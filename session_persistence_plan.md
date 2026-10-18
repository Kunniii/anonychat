# Implementation Plan: SQLite Session Persistence & Client Reconnect Preservation

## Problem Statement
Currently, chat sessions, pairings, and waiting queues exist exclusively in volatile Node.js process memory (`clients = new Map()`, `blockedPairs = new Map()`).
If the server experiences a hiccup, reload, or crash:
1. In-memory session data is lost. When clients reconnect, the server fails to recognize their active conversation and resets them to "Waiting for a stranger".
2. On the client side, reconnection resets and clears the message history.

## Goals
1. **Server-side SQLite persistence**:
   - Persist active sessions (`clientId`, `partnerId`, `waiting`, `queuedPosition`, `lastSeenAt`) in SQLite using Node.js's native `node:sqlite` (`DatabaseSync`).
   - Store SQLite database file in `./logs/sessions.db` (which is already mounted as a persistent Docker volume in `compose.yaml` and `compose.dev.yaml`).
   - On server startup / restart, load valid active sessions from SQLite into memory and prune sessions that exceeded the grace period.
   - Maintain SQLite in sync on session events: pair creation, message activity, disconnect, end conversation, session expiry.
2. **Client-side Chat Preservation on Reconnect**:
   - When reconnecting (or recovering from server hiccups), do NOT clear `messages` on the client side.
   - Persist active conversation messages in `sessionStorage` so that even if the tab reloads during a hiccup, the conversation history is preserved upon reconnecting.
   - Clear messages only when a conversation truly ends (user clicks "Rời phòng" or receives stranger disconnected and is matched to a *new* stranger).

## Proposed Architecture

### 1. `sessionStore.js` (Server SQLite Storage Module)
Native `node:sqlite` module managing `logs/sessions.db`:
- Tables:
  - `sessions`: `client_id` (TEXT PRIMARY KEY), `partner_id` (TEXT), `is_waiting` (INTEGER), `queued_position` (INTEGER), `last_seen_at` (INTEGER), `created_at` (INTEGER)
  - `blocked_pairs`: `pair_key` (TEXT PRIMARY KEY), `expires_at` (INTEGER)
- Methods:
  - `initSessionDb()`: runs schema migrations (`CREATE TABLE IF NOT EXISTS`, WAL pragma).
  - `upsertSession(session)`: updates or inserts session state.
  - `deleteSession(clientId)`: removes expired or completed session.
  - `loadActiveSessions(reconnectGraceMs)`: loads unexpired sessions into memory upon server startup.
  - `upsertBlockedPair(pairKey, expiresAt)` & `loadBlockedPairs()` & `deleteBlockedPair(pairKey)`: persists rematch cooldowns.

### 2. Integration into `index.js`
- On startup: call `initSessionDb()` and restore sessions and blocked pairs.
- On `pair(a, b)`: write pairing to SQLite.
- On `disconnect(ws)`: update `last_seen_at` in SQLite.
- On `endConversation(ws)` / `expireSession(session)`: update / delete from SQLite.

### 3. Client Reconnection Logic (`anonychat-fe/src/AnonyChat.jsx`)
- Do not clear messages on reconnection.
- Sync active conversation to `sessionStorage` (`anonychat-active-messages`, `anonychat-partner-color`).
- Only reset messages when user connects to a *brand new* conversation (`isNewConversation` when not reconnecting).

## Verification Plan
1. Unit tests:
   - Test `sessionStore.js` operations (insert, query, cleanup expired, update partner, blocked pairs).
2. End-to-end resilience test:
   - Two clients pair and exchange messages.
   - Server reboots / re-initializes memory from SQLite.
   - Both clients reconnect with their `clientId`.
   - Verify they resume their existing conversation without clearing messages and can continue chatting.
3. Full regression suite:
   - `npm test` (166 profanity filter tests + 19 existing E2E tests).
