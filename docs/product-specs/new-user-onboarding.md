# New User Onboarding

## Goal

Get a new user from install to successful DEVONthink interaction with minimal context.

## Steps

1. Install the package:

```bash
npm install -g devonthink-cli
```

2. Confirm DEVONthink is running and open:

```bash
dt list
```

3. Inspect the global Inbox:

```bash
dt property:get inbox "incoming group"
```

4. Explore a database:

```bash
dt list --db "01. Personal"
```

5. Inspect a record:

```bash
dt property:get --uuid "<record-uuid>" name tags comment
```

6. Run a native search:

```bash
dt search "name:paper" --db "01. Personal"
```

7. Import a file:

```bash
dt add ~/Downloads/paper.pdf --db "01. Personal" --at "/Inbox"
```
