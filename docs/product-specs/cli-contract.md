# CLI Contract

## Product Statement

`devonthink-cli` is a pure CLI wrapper over the DEVONthink scripting dictionary.

## Public Output

- JSON by default
- official DEVONthink property names where practical
- stable locator grammar for shell usage

## Public Command Families

### Object/property commands

- `application get`
- `database list|get|set`
- `group list|get|set`
- `record get|set`

### Dictionary-mirroring commands

- `search`
- `import-path`
- `index-path`
- `create-location`
- `create-record-with`
- `get-record-at`
- `get-record-with-uuid`
- `lookup-records-with-file`
- `lookup-records-with-path`
- `lookup-records-with-tags`
- `lookup-records-with-url`
- `move`
- `delete`
- `duplicate`
- `replicate`
- `compare`
- `classify`

## Non-Goals

- recipes
- recommendations
- auto-trash import workflows
- dedupe policies
- synthetic Inbox abstractions
- folder-summary product layers

If a behavior is useful but non-native, document it as a command sequence.
