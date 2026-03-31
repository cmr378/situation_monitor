# Task Board (M0)

## Agent 1: Intelligence + Contracts
1. Finalize shared contracts in `packages/shared-types` and lock initial endpoint payloads.
2. Implement mock-backed Fastify route stubs for `/briefing`, `/stories`, `/tickers`, `/alerts`.
3. Add lightweight shape guards/validation for outbound responses.
4. Add deterministic mock fixtures and fixed timestamps for standard, degraded, and failure scenarios.
5. Document endpoint examples in `docs/api-contract.md` and keep docs mirrored with shared types.

## Agent 2: Desktop Shell
1. Build desktop layout shell with placeholders for top bar, story feed, briefing panel, ticker/watchlist panel, and timeline.
2. Consume shared contracts from `packages/shared-types` directly (no local redefinition).
3. Wire sections to `packages/mock-data` payloads.
4. Implement loading, empty, error, and stale UI states at skeleton level.
5. Avoid heavy styling and final polish during M0.

## Shared Rules
- Prefer additive changes over refactors.
- Keep PRs small and reviewable.
- Avoid cross-boundary edits unless explicitly required.
- Avoid broad formatting-only changes.
