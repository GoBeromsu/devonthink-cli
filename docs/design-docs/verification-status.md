# Verification Status

High-level verification map for the repository.

## Verified Well

- CLI contract behavior in `test/spec/`
- schema normalization
- locator parsing
- npm pack/publish dry-run flow

## Requires Live-App Smoke Checks

- JXA runtime changes
- DEVONthink proxy serialization changes
- command mappings whose behavior depends on real DEVONthink state

## Rule

If a change touches the live automation boundary, local fake-harness tests are necessary but not sufficient.
