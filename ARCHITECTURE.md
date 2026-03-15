# Architecture

Top-level map of the repository.

## Runtime Shape

The CLI is intentionally thin:

- `src/schema/`
  - checked-in DEVONthink schema artifact
- `src/commands/`
  - command registry and CLI argument mapping
- `src/adapters/jxa/`
  - DEVONthink automation boundary via `osascript -l JavaScript`
- `src/application/`
  - shared types, ports, and error model
- `src/infrastructure/`
  - process execution boundary

## Public Model

The public surface has two layers only:

1. Native DEVONthink dictionary commands
2. Object locators for shell ergonomics

Examples:

- `dt search`
- `dt import-path`
- `dt move`
- `dt application get`
- `dt database get`
- `dt group set`
- `dt record get`

## Boundaries

### Allowed

- schema-driven command metadata
- generic property get/set
- JSON serialization of native DEVONthink objects
- fake DEVONthink harnesses for deterministic CLI specs

### Not allowed

- recipes
- recommendation/ranking systems
- auto-trash or dedupe workflows
- synthetic Inbox subsystems
- product logic that cannot be traced back to DEVONthink's scripting model

## System of Record

- Product contract:
  - `test/spec/`
- Native surface:
  - `src/schema/devonthink-schema.json`
- Maintainer map:
  - `AGENTS.md`
- User docs:
  - `README.md`

## Verification Layers

- Primary:
  - `test/spec/` black-box CLI contract tests
- Supporting:
  - schema tests
  - locator parsing tests
  - JXA adapter tests
- Live:
  - DEVONthink smoke checks on macOS with DEVONthink 4.x
