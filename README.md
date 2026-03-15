# DEVONthink CLI

Pure CLI wrapper for the DEVONthink scripting dictionary.

`devonthink-cli` does not add a workflow layer on top of DEVONthink. It exposes DEVONthink's own scripting model through a shell-friendly command surface:

- dictionary-mirroring commands such as `search`, `import-path`, `move`, `classify`
- generic property access for `application`, `database`, `group`, and `record`
- JSON output by default

Repository-local maintainer docs:

- [AGENTS.md](AGENTS.md)
- [docs/index.md](docs/index.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)

## Requirements

- macOS
- DEVONthink 4.x installed at `/Applications/DEVONthink.app`
- Node.js 20+

## Install

From npm:

```bash
npm install -g devonthink-cli
```

From source:

```bash
pnpm install
pnpm build
pnpm link --global
```

## Quickstart

List open databases:

```bash
dt database list
```

Inspect DEVONthink's global Inbox model:

```bash
dt application get --property "inbox" --property "incoming group"
```

List child groups under a location:

```bash
dt group list --database "01. Personal" --at "/Projects"
```

Read selected properties from a record:

```bash
dt record get \
  --database "01. Personal" \
  --at "/Projects/Existing.pdf" \
  --property name \
  --property tags \
  --property comment
```

Set writable record properties:

```bash
dt record set \
  --uuid "<record-uuid>" \
  --set "comment=Reviewed" \
  --set "tags=project,reading"
```

Run native DEVONthink search:

```bash
dt search "tags:reference" --in-database "01. Personal"
```

Import a local file exactly as DEVONthink does:

```bash
dt import-path ~/Downloads/paper.pdf \
  --to-database "01. Personal" \
  --to-at "/Projects"
```

Move a record to another group:

```bash
dt move \
  --record-uuid "<record-uuid>" \
  --to-database "01. Personal" \
  --to-at "/Projects/Archive"
```

## CLI Model

This package keeps only one CLI-specific layer: object locators.

- Databases:
  - `--name <name>`
  - `--uuid <uuid>`
  - command parameters often use `--<param>-database <name|uuid>`
- Groups:
  - `--database <name|uuid> --at <path>`
  - command parameters often use `--<param>-database <name|uuid> --<param>-at <path>`
- Records:
  - `--uuid <uuid>`
  - or `--database <name|uuid> --at <path>`
  - command parameters often use `--record-uuid <uuid>` or `--record-database ... --record-at ...`

DEVONthink paths are the same location syntax described in the scripting dictionary:

- root-based: `"/Projects/Inbox"`
- literal `/` in names must be escaped as `\/`

## Command Surface

Object/property commands:

- `dt application get`
- `dt database list`
- `dt database get`
- `dt database set`
- `dt group list`
- `dt group get`
- `dt group set`
- `dt record get`
- `dt record set`

Dictionary-mirroring commands:

- `dt search`
- `dt import-path`
- `dt index-path`
- `dt create-location`
- `dt create-record-with`
- `dt get-record-at`
- `dt get-record-with-uuid`
- `dt lookup-records-with-file`
- `dt lookup-records-with-path`
- `dt lookup-records-with-tags`
- `dt lookup-records-with-url`
- `dt move`
- `dt delete`
- `dt duplicate`
- `dt replicate`
- `dt compare`
- `dt classify`

Use `dt --help` or `dt <command> --help` to see the current flag grammar generated from the checked-in DEVONthink schema artifact.

## Examples

List only selected database properties:

```bash
dt database get \
  --name "01. Personal" \
  --property path \
  --property root \
  --property "incoming group"
```

Create a location hierarchy:

```bash
dt create-location "/Projects/2026/Papers" --in-database "01. Personal"
```

Create a new note-like record from a property dictionary:

```bash
dt create-record-with \
  '{"name":"Scratch","type":"markdown","tags":["draft"]}' \
  --in-database "01. Personal" \
  --in-at "/Projects"
```

Lookup by filename:

```bash
dt lookup-records-with-file "paper.pdf" --in-database "01. Personal"
```

Lookup by tags:

```bash
dt lookup-records-with-tags reading llm --any --in-database "01. Personal"
```

Compare similar records:

```bash
dt compare --record-uuid "<record-uuid>"
```

Classify a record:

```bash
dt classify --record-uuid "<record-uuid>" --in-database "01. Personal"
```

## Philosophy

This package intentionally does not add:

- recipe systems
- automatic dedupe policies
- import-and-trash workflows
- folder ranking or recommendation logic
- synthetic Inbox subsystems

If DEVONthink provides a scripting command or property, `devonthink-cli` tries to expose it directly. If DEVONthink does not provide a higher-level behavior, this package does not invent one.

## Development

Refresh the checked-in schema from the local DEVONthink scripting dictionary:

```bash
pnpm schema:refresh
```

Run validation:

```bash
pnpm check
pnpm test
pnpm build
pnpm pack:check
```

## Publishing

Verify the package before release:

```bash
pnpm release:check
pnpm publish:dry-run
```

Publish publicly:

```bash
npm login
pnpm publish:public
```

Current npm package name target:

```text
devonthink-cli
```
