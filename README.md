# simple-todo-app

Simple TODO app using a monorepo structure with:
- React frontend (`packages/app`)
- Node.js/Express backend (`packages/server`)
- Kafka event infrastructure (Docker Compose)

## Run locally

Prerequisite: Docker Desktop must be installed and running.

1. Start Kafka infrastructure:
   - `docker compose up -d`
2. Start backend:
   - `npm run dev:server`
3. Start frontend:
   - `npm run dev:app`

Frontend defaults to `http://localhost:4000` for API calls.

## Environment (optional)

For backend (`packages/server`):
- `PORT` (default: `4000`)
- `KAFKA_BROKERS` (default: `localhost:9092`)
- `KAFKA_TOPIC` (default: `todo-events`)

For frontend (`packages/app`):
- `VITE_API_BASE_URL` (default: `http://localhost:4000`)

## Current status

- Phase 1 complete (workspace + infrastructure base)
- Phase 2 complete (Express TODO API + Kafka producer)
- Phase 3 complete (Vite React TODO UI + Tailwind + API integration)
