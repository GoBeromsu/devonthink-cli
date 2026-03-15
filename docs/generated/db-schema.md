# DB Schema

Primary artifact:

- `src/schema/devonthink-schema.json`

This repository uses "db schema" in the same broad sense as the harness-engineering article: a generated structural artifact that anchors the rest of the system.

In this project the generated artifact is the DEVONthink scripting surface, not an application database schema.

## Source

- `sdef /Applications/DEVONthink.app`

## Generator

- `scripts/refresh-schema.mjs`

## Refresh

```bash
pnpm schema:refresh
```

## Usage

- command metadata should follow this artifact
- property metadata should follow this artifact
- if implementation diverges from the artifact, fix the implementation or regenerate the artifact
