# Situation Monitor

Situation Monitor is a desktop command-center app for tracking market, AI, and macro/news developments. This repository is the M0 contract-first scaffold for two parallel coding agents.

## Monorepo Structure

- `apps/desktop` - Tauri target + Vite/React UI shell (placeholder sections only)
- `services/intelligence` - Fastify mock-backed local service
- `packages/shared-types` - canonical TypeScript runtime-facing contracts (single source of truth)
- `packages/mock-data` - deterministic fixtures for normal, degraded, and failure states
- `docs/` - product, architecture, contract mirror, and task board
- `AGENTS.md` - ownership and governance rules

## Local Setup

1. Install Node.js 20+.
2. Install `pnpm` (or use `corepack pnpm`).
3. From repo root:
   - `pnpm install`
   - `pnpm -r typecheck`
   - `pnpm smoke:service`
   - `pnpm verify:no-local-contracts`

Useful dev commands:
- `pnpm dev:service`
- `pnpm dev:desktop`

## Two-Agent Workflow

- Agent 1 owns `services/intelligence` and canonical contracts.
- Agent 2 owns `apps/desktop` and consumes shared contracts.
- Shared contract changes are deliberate and must update all in one PR:
  - `packages/shared-types`
  - `docs/api-contract.md`
  - `packages/mock-data`

## Development Sequence

1. Contracts + mocks
2. Desktop shell against mocks
3. Local intelligence service
4. Wire UI to service

## Tauri + Vite Expectations

- Tauri is the desktop shell target.
- Vite is the day-to-day frontend dev server for iteration.
- Desktop packaging is explicitly out of scope for M0 acceptance.
