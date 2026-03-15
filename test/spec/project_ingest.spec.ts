import { describe, expect, it } from "vitest";
import { parseJsonOutput, runCli } from "./helpers.js";

describe("project ingest executable spec", () => {
  it("lists databases, inspects groups, imports a file, updates record properties, and verifies the result", async () => {
    const dbList = await runCli(["database", "list"]);
    expect(dbList.code).toBe(0);
    expect(parseJsonOutput(dbList.stdout)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "01. Personal" }),
        expect.objectContaining({ name: "Inbox" })
      ])
    );

    const groupList = await runCli([
      "group",
      "list",
      "--database",
      "01. Personal",
      "--at",
      "/Projects"
    ], dbList.port);
    expect(groupList.code).toBe(0);
    expect(parseJsonOutput(groupList.stdout)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Inbox" }),
        expect.objectContaining({ name: "Archive" })
      ])
    );

    const imported = await runCli([
      "import-path",
      "/Users/beomsu/Downloads/NewPaper.pdf",
      "--to-database",
      "01. Personal",
      "--to-at",
      "/Projects"
    ], dbList.port);
    expect(imported.code).toBe(0);
    const importedRecord = parseJsonOutput(imported.stdout) as Record<string, unknown>;
    expect(importedRecord.name).toBe("NewPaper.pdf");
    expect(importedRecord.path).toBe("/Users/beomsu/Downloads/NewPaper.pdf");

    const updated = await runCli([
      "record",
      "set",
      "--uuid",
      String(importedRecord.uuid),
      "--set",
      "name=Project Paper",
      "--set",
      "tags=project,reading",
      "--set",
      "comment=Imported from Downloads"
    ], dbList.port);
    expect(updated.code).toBe(0);
    expect(parseJsonOutput(updated.stdout)).toEqual(
      expect.objectContaining({
        name: "Project Paper",
        tags: ["project", "reading"],
        comment: "Imported from Downloads"
      })
    );

    const fetched = await runCli([
      "get-record-at",
      "/Projects/Project Paper",
      "--in-database",
      "01. Personal"
    ], dbList.port);
    expect(fetched.code).toBe(0);
    expect(parseJsonOutput(fetched.stdout)).toEqual(
      expect.objectContaining({
        name: "Project Paper",
        tags: ["project", "reading"]
      })
    );
  });
});
