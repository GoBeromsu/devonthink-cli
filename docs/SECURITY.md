# SECURITY

## Current Model

This project runs local automation against DEVONthink via `osascript -l JavaScript`.

## Security Notes

- commands act on the user's live DEVONthink databases
- publishable packages should not embed secrets
- docs should not encourage destructive commands without clear intent

## Repository Rule

Prefer narrow, explicit command surfaces and avoid custom automation layers that make side effects harder to predict.
