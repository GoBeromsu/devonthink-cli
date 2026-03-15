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

The public surface uses task-oriented verbs with colon-namespaced grouping:

- Core: `add`, `databases`, `delete`, `duplicate`, `get`, `groups`, `move`, `replicate`, `search`
- Property: `property:read`, `property:set`
- Create: `create:group`, `create:record`
- Lookup: `lookup:file`, `lookup:tags`, `lookup:url`, `lookup:path`
- AI: `ai:classify`, `ai:compare`
- Other: `index`

Locators are simplified:

- `--uuid` for records
- `--db` / `--at` for database/group targeting
- `--to-db` / `--to` for destination
- `--from-db` / `--from` for source

## Boundaries

### Allowed

- hand-coded command classes per verb
- generic property get/set across entity types
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
