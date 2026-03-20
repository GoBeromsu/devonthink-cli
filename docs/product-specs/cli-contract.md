# CLI Contract

## Product Statement

`devonthink-cli` is a pure CLI wrapper over the DEVONthink scripting dictionary.

## Public Output

- JSON by default
- official DEVONthink property names where practical
- stable locator grammar for shell usage

## Public Command Families

### Core commands (top-level, daily use)

- `add` — import files/folders
- `databases` — list open databases
- `delete` — delete records
- `duplicate` — duplicate a record to another group
- `get` — get a record by UUID or path
- `groups` — list child groups in a database
- `move` — move records between groups
- `replicate` — replicate a record to another group
- `search` — search for records

### Property commands

- `property:read` — read properties from any entity (application, database, group, record)
- `property:set` — write properties on any entity (database, group, record)

### Create commands

- `create:group` — create group hierarchies
- `create:record` — create records from property dictionaries

### Lookup commands

- `lookup:file` — find records by filename
- `lookup:tags` — find records by tags
- `lookup:url` — find records by URL
- `lookup:path` — find records by file path

### AI commands

- `ai:classify` — classify records into suggested groups
- `ai:compare` — find similar records

### Other

- `index` — index files without copying

## Non-Goals

- recipes
- recommendations
- auto-trash import workflows
- dedupe policies
- synthetic Inbox abstractions
- folder-summary product layers

If a behavior is useful but non-native, document it as a command sequence.

## Command Sequences

Group operations that DEVONthink supports natively but that use the generic property/delete commands:

### Rename a group

```bash
dt property:set --db "01. Personal" --at "/Projects/OldName" name=NewName
```

### Delete a group

```bash
# Get the group UUID first, then delete
dt get --db "01. Personal" --at "/Projects/Stale"
dt delete --uuid "<group-uuid>"
```

### Full folder import workflow

```bash
# 1. Create the destination group hierarchy
dt create:group "/Projects/2026/Papers" --db "01. Personal"

# 2. Import files into the group
dt add ~/Downloads/papers/ --db "01. Personal" --at "/Projects/2026/Papers"

# 3. Verify contents
dt groups --db "01. Personal" /Projects/2026/Papers
```
