# DEVONthink CLI

Pure CLI wrapper for the DEVONthink scripting dictionary.

`devonthink-cli` does not add a workflow layer on top of DEVONthink. It exposes DEVONthink's own scripting model through a shell-friendly, task-oriented command surface:

- intuitive top-level verbs (`add`, `delete`, `move`, `list`, `search`)
- colon-namespaced grouping (`property:get`, `lookup:tags`, `ai:classify`)
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
dt list
```

Inspect DEVONthink's global Inbox model:

```bash
dt property:get inbox "incoming group"
```

List child groups under a location:

```bash
dt list --db "01. Personal" /Projects
```

Read selected properties from a record:

```bash
dt property:get --uuid "<record-uuid>" name tags comment
```

Set writable record properties:

```bash
dt property:set --uuid "<record-uuid>" comment=Reviewed tags=project,reading
```

Run native DEVONthink search:

```bash
dt search "tags:reference" --db "01. Personal"
```

Import a local file:

```bash
dt add ~/Downloads/paper.pdf --db "01. Personal" --at "/Projects"
```

Move a record to another group:

```bash
dt move --uuid "<record-uuid>" --to-db "01. Personal" --to "/Projects/Archive"
```

## CLI Model

Locators determine which entity you are addressing:

- `--uuid <uuid>` — record (by UUID or item link)
- `--db <name|uuid> --at <path>` — group or record at a specific location
- `--db <name|uuid>` — database itself
- _(no locator)_ — application

Destination/source containers use prefixed options:

- `--to-db <name|uuid> --to <path>` — destination group
- `--from-db <name|uuid> --from <path>` — source group

DEVONthink paths use the same location syntax as the scripting dictionary:

- root-based: `"/Projects/Inbox"`
- literal `/` in names must be escaped as `\/`

## Command Surface

### Core

| Command | Description |
|---|---|
| `dt add <path>` | Import a file or folder |
| `dt delete --uuid X` | Delete a record |
| `dt move --uuid X --to-db X --to /Y` | Move a record |
| `dt list [--db X] [/path]` | List databases or groups |
| `dt search "query" [--db X]` | Search for records |

### Property

| Command | Description |
|---|---|
| `dt property:get [locator] <prop> ...` | Read properties from any entity |
| `dt property:set [locator] key=val ...` | Write properties on any entity |

### Create

| Command | Description |
|---|---|
| `dt create:location /path --db X` | Create a hierarchy of groups |
| `dt create:record '{"name":"X"}' --db X --at /Y` | Create a new record |

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
| `dt ai:classify --uuid X [--db X]` | Classify a record |
| `dt ai:compare --uuid X` | Find similar records |

### Record

| Command | Description |
|---|---|
| `dt record:get --uuid X` | Get a record by UUID |
| `dt record:get --db X --at /path` | Get a record by location |
| `dt record:duplicate --uuid X --to-db X --to /Y` | Duplicate a record |
| `dt record:replicate --uuid X --to-db X --to /Y` | Replicate a record |

### Other

| Command | Description |
|---|---|
| `dt index <path> --db X` | Index without copying |

Use `dt --help` or `dt <command> --help` for detailed usage.

## Examples

List only selected database properties:

```bash
dt property:get --db "01. Personal" path root "incoming group"
```

Create a location hierarchy:

```bash
dt create:location "/Projects/2026/Papers" --db "01. Personal"
```

Create a new record from a property dictionary:

```bash
dt create:record \
  '{"name":"Scratch","type":"markdown","tags":["draft"]}' \
  --db "01. Personal" --at "/Projects"
```

Lookup by filename:

```bash
dt lookup:file "paper.pdf" --db "01. Personal"
```

Lookup by tags:

```bash
dt lookup:tags reading llm --any --db "01. Personal"
```

Compare similar records:

```bash
dt ai:compare --uuid "<record-uuid>"
```

Classify a record:

```bash
dt ai:classify --uuid "<record-uuid>" --db "01. Personal"
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
