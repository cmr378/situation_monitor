# AGENTS: Situation Monitor

## Project Goal
Build a desktop command center for markets, AI, and macro/news developments. The initial milestone (M0) is a clean scaffold for safe parallel work by two agents.

## v1 Scope
- Relevant news stories
- Stock ticker and watchlist data
- AI-generated briefing panel
- Alerts
- Story clustering and deduping
- Clean desktop UI shell

## Explicit Folder Ownership
- Agent 1 owns `services/intelligence` and is the contract authority.
- Agent 2 owns `apps/desktop` and consumes shared contracts.
- Shared ownership areas:
  - `packages/shared-types`
  - `packages/mock-data`
  - `docs/api-contract.md`

## Canonical Contract Rules
- `packages/shared-types` is the single source of truth for runtime-facing contracts.
- `docs/api-contract.md` must explain and mirror shared types and must not diverge.
- Agent 1 owns canonical data contract definitions and freeze sign-off.
- Agent 2 must consume shared contracts and must not redefine runtime interfaces locally.
- Contract changes must update all of the following in the same PR:
  - `packages/shared-types`
  - `docs/api-contract.md`
  - `packages/mock-data`
- No agent may rename or relocate shared contract files, package names, or top-level directories without explicit rationale documented in the PR or docs.

## Freeze Gate
Agent 1 must finalize and freeze initial payload shapes for `/briefing`, `/stories`, `/tickers`, and `/alerts` before Agent 2 proceeds beyond placeholder rendering and simple mock consumption.

## Branch and Worktree Rules
- Use one branch per agent and one worktree per branch.
- Branch naming convention: `codex/agent1-*` and `codex/agent2-*`.
- Keep PRs small, additive, and reviewable.
- Avoid touching another agent's owned directory unless the task explicitly requires it.
- Avoid broad formatting-only churn.

## Coding Standards
- TypeScript-first for app, service, and shared contracts.
- Prefer additive changes over refactors during scaffold stage.
- Keep dependencies minimal and practical for local development.
- Use deterministic mock data for reproducibility.

## Testing and Lint Expectations
- Required baseline checks:
  - `pnpm install`
  - `pnpm -r typecheck`
  - `pnpm smoke:service`
  - `pnpm verify:no-local-contracts`
- Linting can be added later; do not block scaffold completion on advanced lint/format setup.

## Do Not Build Yet
- Authentication
- Database or ORM
- Caching beyond trivial in-memory placeholders
- Background job framework
- Queues or event buses
- Live news ingestion
- Live market data integrations
- Persistence design
- CI/CD setup
- Production deployment work
- Full desktop packaging flow

## M0 Service Constraint
`services/intelligence` remains a lightweight local mock-backed service. It is not a full backend platform in this stage.
