# Verification Status

High-level verification map for the repository.

## Verified Well

- CLI contract behavior in `test/spec/`
- schema normalization
- locator parsing
- npm pack/publish dry-run flow

## Live Smoke Tests

End-to-end tests in `test/smoke/` exercise the real CLI binary against a live DEVONthink instance.

Prerequisites:

- DEVONthink 4.x must be running
- A database named `dt-cli-smoke` must be open

Run: `pnpm test:smoke`

Smoke tests are opt-in and not part of `pnpm test`. They use a separate vitest config with 30s timeouts and sequential execution to avoid DEVONthink race conditions.

## Requires Live-App Smoke Checks

- JXA runtime changes
- DEVONthink proxy serialization changes
- command mappings whose behavior depends on real DEVONthink state

## Rule

If a change touches the live automation boundary, local fake-harness tests are necessary but not sufficient.
