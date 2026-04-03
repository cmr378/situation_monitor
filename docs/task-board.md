# Task Board (M0)

## Agent 1: Intelligence + Contracts
1. Finalize shared contracts in `packages/shared-types` and lock initial endpoint payloads.
2. Implement mock-backed Fastify route stubs for `/briefing`, `/stories`, `/tickers`, `/alerts`.
3. Add lightweight shape guards/validation for outbound responses.
4. Add deterministic mock fixtures and fixed timestamps for standard, degraded, and failure scenarios.
5. Document endpoint examples in `docs/api-contract.md` and keep docs mirrored with shared types.

## Agent 2: Desktop Shell
1. Build a configurable desktop layout shell with top bar, story feed, briefing panel, ticker/watchlist panel, and timeline widgets.
2. Consume shared contracts from `packages/shared-types` directly (no local redefinition).
3. Poll the local intelligence service through one typed desktop data layer.
4. Add layout presets, drag/resize interactions, theming, and widget context menus without redefining runtime contracts locally.
5. Fall back per panel to deterministic mock payloads when service requests fail.

## Shared Rules
- Prefer additive changes over refactors.
- Keep PRs small and reviewable.
- Avoid cross-boundary edits unless explicitly required.
- Avoid broad formatting-only changes.
- Run `pnpm verify:repo-hygiene` before pushing branches.
