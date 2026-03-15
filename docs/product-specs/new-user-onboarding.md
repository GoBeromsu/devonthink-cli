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
dt database list
```

3. Inspect the global Inbox:

```bash
dt application get --property inbox --property "incoming group"
```

4. Explore a database:

```bash
dt group list --database "01. Personal" --at "/"
```

5. Inspect a record:

```bash
dt record get --database "01. Personal" --at "/Some Folder/Some Record"
```

6. Run a native search:

```bash
dt search "name:paper" --in-database "01. Personal"
```

7. Import a file:

```bash
dt import-path ~/Downloads/paper.pdf --to-database "01. Personal" --to-at "/Inbox"
```
