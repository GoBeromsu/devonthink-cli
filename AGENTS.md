# AGENTS

Short map for humans and coding agents.

This repository follows the harness-engineering model described by OpenAI: keep `AGENTS.md` short, and treat structured repo-local docs as the system of record.

Reference:

- [Harness Engineering](https://openai.com/index/harness-engineering/)

## What This Repo Is

`devonthink-cli` is a pure CLI wrapper over the DEVONthink scripting dictionary.

- Expose native DEVONthink commands.
- Expose native properties generically.
- Do not add workflow layers that DEVONthink itself does not provide.

## Read Order

1. [README.md](README.md)
2. [docs/index.md](docs/index.md)
3. [ARCHITECTURE.md](ARCHITECTURE.md)

Then branch based on task:

- Product behavior:
  - [docs/product-specs/index.md](docs/product-specs/index.md)
- Design intent and constraints:
  - [docs/design-docs/index.md](docs/design-docs/index.md)
- Current/unfinished work:
  - [docs/exec-plans/active/README.md](docs/exec-plans/active/README.md)
  - [docs/exec-plans/tech-debt-tracker.md](docs/exec-plans/tech-debt-tracker.md)
- Generated truth:
  - [docs/generated/db-schema.md](docs/generated/db-schema.md)
  - [src/schema/devonthink-schema.json](src/schema/devonthink-schema.json)
- External reference material:
  - [docs/references/index.md](docs/references/index.md)

## Folder Guide

- `src/`
  - implementation
- `test/spec/`
  - executable CLI contract
- `docs/design-docs/`
  - principles, constraints, architecture beliefs
- `docs/product-specs/`
  - user-visible behavior and verification rules
- `docs/exec-plans/`
  - active work, completed work, and technical debt
- `docs/generated/`
  - generated or generated-adjacent artifacts derived from authoritative sources
- `docs/references/`
  - external references worth keeping repo-local

## How To Use The Docs

- If behavior is unclear, read `docs/product-specs/` before reading code.
- If a change affects boundaries or design rules, update `ARCHITECTURE.md` and `docs/design-docs/`.
- If a change affects public behavior, update `test/spec/` and the relevant product spec in the same change.
- If the DEVONthink dictionary surface changes, refresh the schema and update `docs/generated/`.
- If a proposed feature is not native to DEVONthink, document it as a command sequence instead of implementing it.

## Required Verification

Before release:

```bash
pnpm check
pnpm test
pnpm build
pnpm pack:check
```

For JXA/runtime changes, also run live DEVONthink smoke checks.
