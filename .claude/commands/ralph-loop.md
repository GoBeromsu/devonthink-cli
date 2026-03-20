# Ralph Loop — devonthink-cli

You are running an iterative improvement loop on this CLI.

## Loop Protocol

Each iteration follows this cycle:

### 1. EXPLORE
- Read test failures, lint errors, or the user's reported issue.
- Scan current state: `pnpm check`, `pnpm test`, `pnpm build`.
- Identify the single most valuable thing to fix or improve next.

### 2. SPEC
- If the change affects public CLI behavior: write or update a test in `test/spec/`.
- If the change affects live JXA behavior: write or update a test in `test/smoke/`.
- If the change is internal-only: ensure existing tests still cover it.

### 3. IMPLEMENT
- Make the minimal code change to pass the spec.
- Touch only what's necessary. No drive-by refactors.
- Follow existing patterns in the codebase.

### 4. VERIFY
```bash
pnpm check && pnpm test && pnpm build
```
All three must pass. If any fails, fix before proceeding.

### 5. LIVE CHECK (conditional)
If JXA runtime or adapter code was touched:
```bash
pnpm test:smoke
```
Requires DEVONthink open + `dt-cli-smoke` database.

### 6. DOC
If public behavior changed, update in the same commit:
- `test/spec/` (already done in SPEC step)
- Relevant file in `docs/product-specs/`
- `README.md` if end-user usage changed

### 7. COMMIT
Stage and commit with a clear message describing what changed and why.

## Completion

When all checks pass and there are no remaining failures:

```
<promise>VERIFIED</promise>
```

Then ask: "Continue to next iteration, or stop here?"

## Rules

- One logical change per iteration. Don't batch unrelated fixes.
- If something goes sideways, STOP and re-plan. Don't push through.
- Never skip `pnpm check && pnpm test && pnpm build`.
- `pnpm pack:check` after any change to package.json, tsconfig, or dist structure.
- Read before you edit. Understand before you change.
