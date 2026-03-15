# Harness Engineering

This repository applies the harness-engineering idea to a CLI product.

Reference:

- [Harness Engineering](https://openai.com/index/harness-engineering/)

## Why This Repository Uses Structured Docs

The article argues for three things that matter here:

- keep `AGENTS.md` short and use it as a table of contents
- move durable knowledge into a structured `docs/` directory
- make behavior legible and enforceable for agents

That maps directly to this repository:

- `AGENTS.md`
  - short map
- `docs/`
  - system of record for intent and process
- `test/spec/`
  - executable behavior contract
- `src/schema/devonthink-schema.json`
  - generated truth for native DEVONthink surface

## What "Harness" Means In This Repo

A harness is any mechanism that makes a change easier to specify, verify, and preserve.

Current harnesses:

- CLI contract specs
- schema artifact
- JXA boundary tests
- build and pack checks
- live DEVONthink smoke checks

## Practical Rule

Before adding code, ask:

`Where is the repo-local source of truth for this behavior?`

If the answer is "nowhere", add the doc/spec/harness first.
