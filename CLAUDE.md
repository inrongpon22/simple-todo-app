# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root (runs across all workspaces)
```bash
npm run build        # Build all workspaces
npm run dev:app      # Start frontend dev server
npm run dev:server   # Start backend dev server
npm test             # Run tests (no tests configured yet)
```

### Frontend (`packages/app`)
```bash
npm run dev          # Vite dev server with HMR
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm run preview      # Preview production build
```

### Backend (`packages/server`)
```bash
npm run dev          # Nodemon + tsx watch mode (auto-reloads on .ts changes)
npm run build        # tsc compile to dist/
npm run start        # Run compiled dist/index.js
```

### Infrastructure
```bash
docker compose up -d   # Start Zookeeper, Kafka, PostgreSQL
```

## Architecture

This is an npm workspaces monorepo with two packages:

- **`packages/app`** — React 19 + TypeScript + Vite + Tailwind CSS frontend
- **`packages/server`** — Node.js + Express 5 + KafkaJS backend

### Data Flow

1. `App.tsx` fetches todos from `GET /todos` on mount and renders the list
2. User submits the form → `POST /todos` (create) or clicks delete → `DELETE /todos/:id`
3. Express stores todos in an **in-memory array** (no database persistence yet — PostgreSQL is defined in `docker-compose.yml` but not wired up)
4. On each create/delete, the server publishes a Kafka event to the `todo-events` topic (`todo.created` / `todo.deleted`)
5. The frontend updates its state directly from API responses; there is no Kafka consumer on the frontend

### Environment Variables

Backend defaults (set in `packages/server/src/index.ts`):
- `PORT=4000`
- `KAFKA_BROKERS=localhost:9092`
- `KAFKA_TOPIC=todo-events`

Frontend (set via `.env` in `packages/app`):
- `VITE_API_BASE_URL=http://localhost:4000`

### CI/CD

GitHub Actions (`.github/workflows/building.yml`) triggers on push/PR to `main`: installs with `npm ci`, builds, runs tests, then sends a Discord notification via the `DISCORD_WEBHOOK` secret.

## Coding Conventions

### Frontend (`packages/app`)

- **Class components** — all React components are written as `class Foo extends React.Component`. No function components.
- **Private member prefix** — every `private` method and property must be prefixed with `_` (e.g. `private _handleClick`, `private _loadTodos`). Public and protected members have no prefix.
- **Domain models as classes** — data models use plain TypeScript classes with explicit field declarations (no constructor parameter properties — `erasableSyntaxOnly` is enabled).

### Current State

- **No tests** are implemented — `npm test` is a no-op
- **PostgreSQL** is defined in Docker Compose but not used; todos live in memory only
- The Kafka producer is wired up; no consumer exists yet
