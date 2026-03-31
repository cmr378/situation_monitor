# Architecture (M0)

## High-Level
- `packages/shared-types` defines all runtime-facing contracts.
- `packages/mock-data` provides deterministic fixtures shaped by shared contracts.
- `services/intelligence` serves mock-backed API routes with lightweight response guards.
- `apps/desktop` renders a placeholder shell using shared contracts and mock payloads.

## Ownership Boundaries
- Agent 1: contract authority + intelligence service
- Agent 2: desktop app shell
- Shared: contracts, mock fixtures, mirrored API contract docs

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

## M0 Contract Freeze Gate
Agent 2 should not progress beyond placeholder rendering and simple mock consumption until Agent 1 freezes payload shapes for:
- `GET /briefing`
- `GET /stories`
- `GET /tickers`
- `GET /alerts`
