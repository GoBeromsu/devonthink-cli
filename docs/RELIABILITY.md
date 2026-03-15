# RELIABILITY

## Main Reliability Risks

### 1. JXA proxy behavior can be surprising

- Mitigation:
  - keep runtime serialization small and explicit
  - smoke test against live DEVONthink

### 2. Schema drift

- Mitigation:
  - regenerate `src/schema/devonthink-schema.json`
  - verify command mapping against live app

### 3. Documentation drift

- Mitigation:
  - keep `AGENTS.md` short
  - keep deeper truth in structured docs
  - update specs and docs in the same change
