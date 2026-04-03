# Situation Monitor

Situation Monitor is a desktop command-center app for tracking market, AI, and macro/news developments. This repository is the M0 contract-first scaffold for two parallel coding agents.

## Monorepo Structure

- `apps/desktop` - Tauri target + Vite/React command shell with configurable widgets, theming, and mock-backed sections
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
   - `pnpm verify:repo-hygiene`
   - `pnpm verify:no-local-contracts`

Useful dev commands:
- `pnpm dev:service`
- `pnpm dev:desktop`

## Desktop Shell Status

`apps/desktop` now includes:
- Configurable widget layout presets
- Drag and resize interactions
- Light and dark theming
- Widget add, replace, and delete context menus

The desktop now polls the local intelligence service every 30 seconds and falls back per panel to deterministic mock data if an endpoint is unavailable.

## Service Runtime Modes

`services/intelligence` supports two runtime modes:
- `mock` (default): deterministic fixtures and scenario-based payloads.
- `live`: provider-backed ingestion with safe fallbacks.

Live mode environment variables:
- `INTELLIGENCE_DATA_MODE=live`
- `MASSIVE_API_KEY` (or `POLYGON_API_KEY` as fallback alias)
- `NEWS_API_KEY`
- `LLM_API_KEY` (or `OPENAI_API_KEY`) for LLM briefing generation

Optional tuning:
- `WATCHLIST_SYMBOLS=NVDA,MSFT,SPY`
- `NEWS_API_QUERY=(markets OR macro OR AI)`
- `INTELLIGENCE_CACHE_TTL_MS=30000`

Desktop runtime environment:
- `VITE_INTELLIGENCE_BASE_URL=http://127.0.0.1:4000`

## Two-Agent Workflow

- Agent 1 owns `services/intelligence` and canonical contracts.
- Agent 2 owns `apps/desktop` and consumes shared contracts.
- Shared contract changes are deliberate and must update all in one PR:
  - `packages/shared-types`
  - `docs/api-contract.md`
  - `packages/mock-data`

## Development Sequence

1. Contracts + mocks
2. Desktop shell against mocks with interactive dashboard behavior
3. Local intelligence service
4. Wire UI to service with panel-level mock fallback

## Tauri + Vite Expectations

- Tauri is the desktop shell target.
- Vite is the day-to-day frontend dev server for iteration.
- Desktop packaging is explicitly out of scope for M0 acceptance.
