# QUALITY SCORE

Qualitative scorecard for the repository.

## Product boundary clarity

- Score:
  - good
- Reason:
  - pure wrapper boundary is explicit in code, tests, and docs

## Executable specification

- Score:
  - good
- Reason:
  - `test/spec/` captures core CLI behavior

## Generated truth

- Score:
  - good
- Reason:
  - DEVONthink schema artifact is checked in and refreshable

## Runtime boundary reliability

- Score:
  - medium
- Reason:
  - JXA serialization is covered by tests but still depends on live DEVONthink behavior

## Documentation structure

- Score:
  - good
- Reason:
  - docs are now structured and linked from a short `AGENTS.md`
