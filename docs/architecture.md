# Architecture (M0)

## High-Level
- `packages/shared-types` defines all runtime-facing contracts.
- `packages/mock-data` provides deterministic fixtures shaped by shared contracts.
- `services/intelligence` serves API routes with mock default mode and live provider mode.
- `apps/desktop` renders a configurable command shell using shared contracts and mock payloads.

## Ownership Boundaries
- Agent 1: contract authority + intelligence service
- Agent 2: desktop app shell
- Shared: contracts, mock fixtures, mirrored API contract docs

## Repo Hygiene
- Tracked `node_modules`, `dist`, `.DS_Store`, and `*.tsbuildinfo` files are forbidden.
- Run `pnpm verify:repo-hygiene` with the other baseline checks before pushing changes.

## API Shape Standard
All M0 endpoint responses use:

```ts
ApiResponse<T> = {
  data: T;
  meta?: {
    generatedAt: string;
    source: 'mock' | 'live';
  };
}
```

## Runtime Data Sources (V1)
- Market data provider: Massive API (formerly Polygon)
- News provider: NewsAPI
- Briefing generation: dual mode (LLM primary, deterministic template fallback)
- Provider failures and missing API keys degrade to safe payloads instead of crashing routes.

## M0 Contract Freeze Gate
Agent 2 should not progress beyond placeholder rendering and simple mock consumption until Agent 1 freezes payload shapes for:
- `GET /briefing`
- `GET /stories`
- `GET /tickers`
- `GET /alerts`

## Desktop Shell Status
- The desktop shell now supports layout presets, drag/resize interactions, theming, and widget context menus.
- The shell remains mock-driven until the follow-up service integration step.
