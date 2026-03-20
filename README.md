# DEVONthink CLI

Control DEVONthink from the command line. `devonthink-cli` exposes DEVONthink's scripting dictionary through shell-friendly verbs, JSON output, and a consistent locator grammar.

```bash
# List databases
dt databases

# Import a file into a specific group
dt add ~/Downloads/paper.pdf --db "01. Personal" --at "/Projects"

# Search across a database
dt search "tags:reference" --db "01. Personal"
```

## Requirements

- macOS with DEVONthink 4.x
- Node.js 20+

## Install

```bash
npm install -g devonthink-cli
```

Verify the installation:

```bash
dt databases
```

This prints a JSON array of open DEVONthink databases. If DEVONthink is not running, the command exits with an error.

## Quickstart

List child groups inside a database:

```bash
dt groups --db "01. Personal" /Projects
```

Read properties from a record:

```bash
dt property:read --uuid "<record-uuid>" name tags comment
```

Set writable properties:

```bash
dt property:set --uuid "<record-uuid>" comment=Reviewed tags=project,reading
```

Import a file:

```bash
dt add ~/Downloads/paper.pdf --db "01. Personal" --at "/Projects"
```

The command prints the imported record as JSON, including its `uuid` and `path`.

Move a record to another group:

```bash
dt move --uuid "<record-uuid>" --to-db "01. Personal" --to "/Projects/Archive"
```

## Locator Model

Every command targets a DEVONthink entity through a locator:

| Locator | Target |
|---|---|
| `--uuid <uuid>` | Record by UUID or item link |
| `--db <name> --at <path>` | Record or group at a specific path |
| `--db <name>` | Database itself |
| _(none)_ | Application |

All record commands (`get`, `move`, `delete`, `duplicate`, `replicate`) accept **either** `--uuid` or `--db --at`. You never need to look up a UUID first:

```bash
# Move by path (no UUID needed)
dt move --db "01. Personal" --at "/Inbox/Report.pdf" --to-db "01. Personal" --to "/Projects"

# Delete by path
dt delete --db "01. Personal" --at "/Projects/Stale"
```

Destination and source use prefixed options:

| Option | Purpose |
|---|---|
| `--to-db <name> --to <path>` | Destination group |
| `--from-db <name> --from <path>` | Source group |

DEVONthink paths follow the scripting dictionary syntax: root-based (`"/Projects/Inbox"`), with literal `/` in names escaped as `\/`.

## Commands

### Core

| Command | Description |
|---|---|
| `dt add <path>` | Import a file or folder |
| `dt databases` | List open databases |
| `dt delete` | Delete a record (`--uuid` or `--db --at`) |
| `dt duplicate` | Duplicate a record (`--uuid` or `--db --at`) |
| `dt get` | Get a record by UUID or path |
| `dt groups --db X [/path]` | List child groups |
| `dt move` | Move a record (`--uuid` or `--db --at`) |
| `dt replicate` | Replicate a record (`--uuid` or `--db --at`) |
| `dt search "query" [--db X]` | Search for records |

### Property

| Command | Description |
|---|---|
| `dt property:read [locator] <prop> ...` | Read properties from any entity |
| `dt property:set [locator] key=val ...` | Write properties on any entity |

### Create

| Command | Description |
|---|---|
| `dt create:group /path --db X` | Create group hierarchies |
| `dt create:record '{"name":"X"}' --db X --at /Y` | Create a record from a property dictionary |

### Lookup

| Command | Description |
|---|---|
| `dt lookup:file "name" --db X` | Find records by filename |
| `dt lookup:tags tag1 tag2 [--any] --db X` | Find records by tags |
| `dt lookup:url "https://..." --db X` | Find records by URL |
| `dt lookup:path "/path" --db X` | Find records by file path |

### AI

| Command | Description |
|---|---|
| `dt ai:classify --uuid X [--db X]` | Classify a record into suggested groups |
| `dt ai:compare --uuid X` | Find similar records |

### Other

| Command | Description |
|---|---|
| `dt index <path> --db X` | Index a file without copying |

Run `dt --help` or `dt <command> --help` for full usage.

## Examples

### Inspect database properties

```bash
dt property:read --db "01. Personal" path root "incoming group"
```

### Create a group hierarchy and import files

```bash
dt create:group "/Projects/2026/Papers" --db "01. Personal"
dt add ~/Downloads/papers/ --db "01. Personal" --at "/Projects/2026/Papers"
dt groups --db "01. Personal" /Projects/2026/Papers
```

### Create a record from a property dictionary

```bash
dt create:record \
  '{"name":"Scratch","type":"markdown","tags":["draft"]}' \
  --db "01. Personal" --at "/Projects"
```

### Find records by tag

```bash
dt lookup:tags reading llm --any --db "01. Personal"
```

### Rename a group

```bash
dt property:set --db "01. Personal" --at "/Projects/OldName" name=NewName
```

### Delete a group

```bash
dt delete --db "01. Personal" --at "/Projects/Stale"
```

### Classify and compare with DEVONthink AI

```bash
dt ai:classify --uuid "<record-uuid>" --db "01. Personal"
dt ai:compare --uuid "<record-uuid>"
```

## Philosophy

`devonthink-cli` exposes what DEVONthink provides. It does not add recipe systems, dedupe policies, import-and-trash workflows, folder ranking, or synthetic Inbox subsystems. If DEVONthink does not offer a behavior natively, this package does not invent one.

## Development

```bash
pnpm install
pnpm check          # TypeScript + doc validation
pnpm test           # 32 spec tests (fake harness)
pnpm test:smoke     # 17 live tests (requires DEVONthink + dt-cli-smoke database)
pnpm build
pnpm pack:check     # Package integrity
```

Refresh the schema from the local DEVONthink scripting dictionary:

```bash
pnpm schema:refresh
```

## Publishing

```bash
pnpm release:check
npm publish --access public
```

## License

MIT
