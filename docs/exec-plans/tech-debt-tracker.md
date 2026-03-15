# Tech Debt Tracker

Open technical debt that should stay visible to agents and maintainers.

## Current Items

### 1. Search result serialization is intentionally minimal

- Status:
  - accepted tradeoff
- Why:
  - direct command results are serialized as stable minimal shapes instead of full dynamic property bags
- Follow-up:
  - document per-command result expectations more explicitly if users need stronger machine contracts

### 2. Generated docs are lighter than the schema artifact itself

- Status:
  - acceptable for now
- Why:
  - the real generated truth is `src/schema/devonthink-schema.json`
- Follow-up:
  - add richer generated markdown summaries only if they can be kept mechanically in sync
