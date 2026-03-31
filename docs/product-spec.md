# Product Spec (M0 Scaffold)

## Goal
Establish a clean, contract-first foundation for Situation Monitor v1 development.

## v1 Functional Areas
- News stories relevant to markets/AI/macro
- Story clustering and deduping
- Ticker and watchlist snapshots
- AI-generated briefing summary panel
- Alerts panel
- Desktop UI shell

## M0 Deliverable
- Shared contracts and endpoint response shapes
- Deterministic mock fixtures including degraded/failure states
- Mock-backed intelligence service route stubs
- Desktop placeholder shell consuming shared contracts

## Non-Goals for M0
- Auth
- Database/ORM
- Non-trivial caching
- Queue/event architecture
- Background jobs
- Live integrations
- Persistence strategy
- CI/CD and production deployment
