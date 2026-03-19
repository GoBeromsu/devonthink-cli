import { describe, expect, it } from "vitest";
import { parseJsonOutput, runCli } from "./helpers.js";

describe("organization workflows executable spec", () => {
  it("creates groups, imports folders, indexes folders, moves records, and verifies by path", async () => {
    const created = await runCli([
      "create:group",
      "/Projects/2026/Papers",
      "--db",
      "01. Personal"
    ]);
    expect(created.code).toBe(0);
    expect(parseJsonOutput(created.stdout)).toEqual(
      expect.objectContaining({
        name: "Papers",
        location: "/Projects/2026"
      })
    );

    const importedFolder = await runCli([
      "add",
      "/Users/beomsu/Documents/Research/",
      "--db",
      "01. Personal",
      "--at",
      "/Projects/2026"
    ], created.port);
    expect(importedFolder.code).toBe(0);
    expect(parseJsonOutput(importedFolder.stdout)).toEqual(
      expect.objectContaining({
        name: "Research",
        "record type": "group"
      })
    );

    const indexedFolder = await runCli([
      "index",
      "/Users/beomsu/Documents/Reference/",
      "--db",
      "01. Personal",
      "--at",
      "/Projects"
    ], importedFolder.port);
    expect(indexedFolder.code).toBe(0);
    const indexedFolderRecord = parseJsonOutput(indexedFolder.stdout) as Record<string, unknown>;
    expect(indexedFolderRecord).toEqual(
      expect.objectContaining({
        name: "Reference",
        "record type": "group"
      })
    );

    const indexedLookup = await runCli([
      "lookup:path",
      String(indexedFolderRecord.path),
      "--db",
      "01. Personal"
    ], indexedFolder.port);
    expect(indexedLookup.code).toBe(0);
    expect(parseJsonOutput(indexedLookup.stdout)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Reference",
          "record type": "group"
        })
      ])
    );

    const moved = await runCli([
      "move",
      "--uuid",
      "record-existing-1",
      "--to-db",
      "01. Personal",
      "--to",
      "/Projects/Archive"
    ], indexedLookup.port);
    expect(moved.code).toBe(0);
    expect(parseJsonOutput(moved.stdout)).toEqual([
      expect.objectContaining({
        name: "Existing.pdf",
        location: "/Projects/Archive"
      })
    ]);

    const fetched = await runCli([
      "get",
      "--db",
      "01. Personal",
      "--at",
      "/Projects/Archive/Existing.pdf"
    ], moved.port);
    expect(fetched.code).toBe(0);
    expect(parseJsonOutput(fetched.stdout)).toEqual(
      expect.objectContaining({
        name: "Existing.pdf",
        path: "/Users/beomsu/Downloads/Existing.pdf"
      })
    );

    const lookedUp = await runCli([
      "lookup:path",
      "/Users/beomsu/Downloads/Existing.pdf",
      "--db",
      "01. Personal"
    ], fetched.port);
    expect(lookedUp.code).toBe(0);
    expect(parseJsonOutput(lookedUp.stdout)).toEqual([
      expect.objectContaining({
        name: "Existing.pdf",
        location: "/Projects/Archive"
      })
    ]);
  });

  it("moves and deletes only one replicated instance when --from is supplied", async () => {
    const replicated = await runCli([
      "replicate",
      "--uuid",
      "record-existing-1",
      "--to-db",
      "01. Personal",
      "--to",
      "/Projects/Archive"
    ]);
    expect(replicated.code).toBe(0);
    expect(parseJsonOutput(replicated.stdout)).toEqual([
      expect.objectContaining({
        name: "Existing.pdf",
        location: "/Projects/Archive"
      })
    ]);

    const moved = await runCli([
      "move",
      "--uuid",
      "record-existing-1",
      "--from-db",
      "01. Personal",
      "--from",
      "/Projects/Archive",
      "--to-db",
      "01. Personal",
      "--to",
      "/Projects/Inbox"
    ], replicated.port);
    expect(moved.code).toBe(0);
    expect(parseJsonOutput(moved.stdout)).toEqual([
      expect.objectContaining({
        name: "Existing.pdf",
        location: "/Projects/Inbox"
      })
    ]);

    const original = await runCli([
      "get",
      "--db",
      "01. Personal",
      "--at",
      "/Projects/Existing.pdf"
    ], moved.port);
    expect(original.code).toBe(0);

    const movedReplica = await runCli([
      "get",
      "--db",
      "01. Personal",
      "--at",
      "/Projects/Inbox/Existing.pdf"
    ], original.port);
    expect(movedReplica.code).toBe(0);

    const deleted = await runCli([
      "delete",
      "--uuid",
      "record-existing-1",
      "--from-db",
      "01. Personal",
      "--from",
      "/Projects/Inbox"
    ], movedReplica.port);
    expect(deleted.code).toBe(0);
    expect(parseJsonOutput(deleted.stdout)).toBe(true);

    const remaining = await runCli([
      "get",
      "--db",
      "01. Personal",
      "--at",
      "/Projects/Existing.pdf"
    ], deleted.port);
    expect(remaining.code).toBe(0);

    const removedReplica = await runCli([
      "get",
      "--db",
      "01. Personal",
      "--at",
      "/Projects/Inbox/Existing.pdf"
    ], remaining.port);
    expect(removedReplica.code).not.toBe(0);
  });
});
