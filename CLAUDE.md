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

### Database migrations
```bash
npm run db:push          # Apply all pending migrations to the linked Supabase project
npm run db:new <name>    # Create a new timestamped migration file in supabase/migrations/
```

One-time setup (requires [Supabase CLI](https://supabase.com/docs/guides/cli)):
```bash
supabase init            # Creates supabase/config.toml (run once per machine)
supabase link            # Links this directory to your Supabase project
```

## Architecture

This is an npm workspaces monorepo with two packages:

- **`packages/app`** — React 19 + TypeScript + Vite + Tailwind CSS frontend
- **`packages/server`** — Node.js + Express 5 + KafkaJS backend

### Data Flow

1. `App.tsx` fetches todos from `GET /todos` on mount and renders the list
2. User submits the form → `POST /todos` (create) or clicks delete → `DELETE /todos/:id`
3. Express reads/writes todos to **Supabase (PostgreSQL)** via `@supabase/supabase-js`
4. On each create/delete, the server publishes a Kafka event to the `todo-events` topic (`todo.created` / `todo.deleted`)
5. The frontend updates its state directly from API responses; there is no Kafka consumer on the frontend

### Database Schema (Supabase / PostgreSQL)

Migrations live in `supabase/migrations/` and are applied with `npm run db:push`. Never write schema directly in the Supabase SQL editor — always create a migration file instead.

| Migration file | Description |
|---|---|
| `20260524000001_create_todos.sql` | `todos` table |
| `20260524000002_create_workout_sessions.sql` | `workout_sessions` table + RLS |
| `20260524000003_create_exercises.sql` | `exercises` table + RLS |

**`todos`**
```sql
create table todos (
  id         uuid        primary key default gen_random_uuid(),
  text       text        not null,
  created_at timestamptz not null default now()
);
```

**`workout_sessions`** — many per user per day; named "[Day] workout [N]" by default
```sql
create table workout_sessions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  date       date        not null default current_date,
  created_at timestamptz not null default now()
);
```

**`exercises`** — many per session; `name` is free text or from the preset list
```sql
create table exercises (
  id         uuid        primary key default gen_random_uuid(),
  session_id uuid        not null references workout_sessions(id) on delete cascade,
  name       text        not null,
  sets       int,
  reps       int,
  weight_kg  numeric,
  notes      text,
  created_at timestamptz not null default now()
);
```

Both `workout_sessions` and `exercises` have Row Level Security enabled — users can only access their own data.

### Environment Variables

Backend (`packages/server/.env`):
- `PORT=4000`
- `KAFKA_BROKERS=localhost:9092`
- `KAFKA_TOPIC=todo-events`
- `SUPABASE_URL=https://your-project-ref.supabase.co`
- `SUPABASE_SERVICE_KEY=your-service-role-key-here`

Frontend (set via `.env` in `packages/app`):
- `VITE_API_BASE_URL=http://localhost:4000`

### CI/CD

GitHub Actions (`.github/workflows/building.yml`) triggers on push/PR to `main`: installs with `npm ci`, builds, runs tests, then sends a Discord notification via the `DISCORD_WEBHOOK` secret.

## Coding Conventions

### Backend (`packages/server`)

Controllers live under `src/controllers/<resource>/` and follow CQRS: **queries** (reads) and **commands** (writes) are in separate subdirectories.

**File naming — kebab-case with `-controller` suffix:**

| Operation | File name |
|---|---|
| Get all (list) | `todos-controller.ts` — plural resource name |
| Get one by ID | `todo-controller.ts` — singular resource name |
| Create | `create-todo-controller.ts` — `<action>-<resource>-controller` |
| Update | `update-todo-controller.ts` — `<action>-<resource>-controller` |
| Delete | `delete-todo-controller.ts` — `<action>-<resource>-controller` |

**Folder layout example (`todos` resource):**
```
controllers/todos/
├── queries/
│   ├── todos-controller.ts       # GET /todos
│   └── todo-controller.ts        # GET /todos/:id
└── commands/
    ├── create-todo-controller.ts  # POST /todos
    ├── update-todo-controller.ts  # PATCH /todos/:id
    └── delete-todo-controller.ts  # DELETE /todos/:id
```

### Frontend (`packages/app`)

- **Class components** — all React components are written as `class Foo extends React.Component`. No function components.
- **Private member prefix** — every `private` method and property must be prefixed with `_` (e.g. `private _handleClick`, `private _loadTodos`). Public and protected members have no prefix.
- **Domain models as classes** — data models use plain TypeScript classes with explicit field declarations (no constructor parameter properties — `erasableSyntaxOnly` is enabled).

### Current State

- **No tests** are implemented — `npm test` is a no-op
- **Supabase** is the database — replace placeholder values in `packages/server/.env` with real credentials
- The Kafka producer is wired up; no consumer exists yet
