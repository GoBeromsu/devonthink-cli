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
- `delete` — delete records
- `move` — move records between groups
- `list` — list databases or groups
- `search` — search for records

### Property commands

- `property:get` — read properties from any entity (application, database, group, record)
- `property:set` — write properties on any entity (database, group, record)

### Create commands

- `create:location` — create group hierarchies
- `create:record` — create records from property dictionaries

### Lookup commands

- `lookup:file` — find records by filename
- `lookup:tags` — find records by tags
- `lookup:url` — find records by URL
- `lookup:path` — find records by file path

### AI commands

- `ai:classify` — classify records into suggested groups
- `ai:compare` — find similar records

### Record commands

- `record:get` — get record by UUID or path
- `record:duplicate` — duplicate a record
- `record:replicate` — replicate a record

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
