## Implementation Plan - Simple TODO Monorepo

This plan sets up a monorepo for a TODO app with a React frontend and a Node.js/Express backend integrated with Kafka.

### Objective

Establish an npm workspaces monorepo with:
- `packages/app`: Vite + React + TypeScript + Tailwind CSS
- `packages/server`: Node.js + Express + KafkaJS
- Root infrastructure for Kafka and Zookeeper

### Key Files

- `package.json` (root): workspace configuration and shared scripts
- `packages/app/`: frontend application
- `packages/server/`: backend API and Kafka integration
- `docker-compose.yml`: Zookeeper + Kafka services
- `.gitignore`: excludes build, dependency, and environment artifacts

### Phases

#### Phase 1: Root and Infrastructure
1. Create root `package.json` with npm workspaces (`packages/*`).
2. Create root `docker-compose.yml` for Zookeeper and Kafka.
3. Create root `.gitignore` for `node_modules`, `dist`, and env files.

#### Phase 2: Server
1. Initialize `packages/server`.
2. Add dependencies: `express`, `kafkajs`, `cors`, `dotenv` (and `nodemon` for dev).
3. Create server entrypoint and TODO CRUD routes.
4. Produce Kafka events for TODO create/delete actions.

#### Phase 3: App
1. Scaffold `packages/app` with Vite (React + TypeScript).
2. Configure Tailwind CSS.
3. Implement TODO UI (add, list, delete).
4. Connect frontend to backend API.

### Progress

- [x] Phase 1 complete
- [x] Phase 2 complete
- [x] Phase 3 complete

### Verification

- Infrastructure: `docker compose up -d` and verify Kafka is healthy.
- Backend: test TODO endpoints and confirm events are produced.
- Frontend: run app and verify API connectivity.
- End-to-end: create/delete TODO and verify UI + Kafka event flow.

### Notes

- Keep implementation minimal and clear.
- Prefer native npm workspaces over additional monorepo tooling.
