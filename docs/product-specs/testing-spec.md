# Testing Spec

`test/spec/` is the primary executable contract for this CLI.

## Primary Tests

Scenario tests under `test/spec/` define the public contract:

- `project_ingest.spec.ts`
- `organization_workflows.spec.ts`
- `inbox_database_model.spec.ts`
- `record_property_access.spec.ts`
- `lookup_and_search.spec.ts`
- `validation_guards.spec.ts`

These tests should:

- invoke the CLI surface
- assert exit codes
- assert JSON output
- assert relevant state transitions

## Supporting Tests

Files outside `test/spec/` support the contract suite:

- schema normalization
- locator parsing
- JXA adapter behavior

## Rule

If public CLI behavior changes, update:

1. `test/spec/`
2. the relevant file in `docs/product-specs/`
3. `README.md` if end-user usage changed
