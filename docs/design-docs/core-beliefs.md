# Core Beliefs

## 1. The CLI is a wrapper, not a second product

If DEVONthink exposes something natively, the CLI may expose it.

If DEVONthink does not expose something natively, the CLI should not invent it as runtime behavior.

## 2. Repo-local truth beats chat-memory truth

Important knowledge must live in versioned files.

That means:

- specs in `test/spec/`
- schema in `src/schema/`
- design rules in `docs/design-docs/`
- plans in `docs/exec-plans/`

## 3. Short entrypoints, deep docs

`AGENTS.md` should stay short.

It is a map, not the encyclopedia.

## 4. Machine-checkable beats narrative-only

When behavior matters, it should be enforced by tests or generated artifacts, not only prose.

## 5. Stable, boring tools improve agent reliability

For this project:

- Node.js
- TypeScript
- `osascript -l JavaScript`
- JSON output
- no plugin runtime
- no DI container

## 6. Specs come before convenience features

Useful workflows should first be captured as command sequences and executable specs.

Only native DEVONthink behavior belongs in the runtime surface.
