import { describe, expect, it } from "vitest";
import { parseJsonOutput, runCli } from "./helpers.js";

describe("validation guard executable spec", () => {
  it("rejects missing values for value-bearing options", async () => {
    const result = await runCli([
      "add",
      "/Users/beomsu/Downloads/NewPaper.pdf",
      "--db",
      "01. Personal",
      "--name"
    ]);

    expect(result.code).toBe(2);
    expect(result.stderr).toContain("Option --name requires a value.");
  });

  it("rejects mixed record locators for get and property:set", async () => {
    const fetched = await runCli([
      "get",
      "--uuid",
      "record-existing-1",
      "--db",
      "01. Personal",
      "--at",
      "/Projects/Existing.pdf"
    ]);
    expect(fetched.code).toBe(2);
    expect(fetched.stderr).toContain(
      "get accepts either --uuid or --db with --at, not both."
    );

    const updated = await runCli([
      "property:set",
      "--uuid",
      "record-existing-1",
      "--db",
      "01. Personal",
      "--at",
      "/Projects",
      "comment=Reviewed"
    ]);
    expect(updated.code).toBe(2);
    expect(updated.stderr).toContain(
      "property:set accepts either --uuid or --db with --at, not both."
    );
  });

  it("rejects incomplete source or destination locator pairs", async () => {
    const move = await runCli([
      "move",
      "--uuid",
      "record-existing-1",
      "--to-db",
      "01. Personal"
    ]);
    expect(move.code).toBe(2);
    expect(move.stderr).toContain("Missing required option: --to.");

    const deleted = await runCli([
      "delete",
      "--uuid",
      "record-existing-1",
      "--from-db",
      "01. Personal"
    ]);
    expect(deleted.code).toBe(2);
    expect(deleted.stderr).toContain("Missing required option: --from.");
  });

  it("rejects extra group path arguments", async () => {
    const result = await runCli([
      "groups",
      "--db",
      "01. Personal",
      "/Projects",
      "/Archive"
    ]);

    expect(result.code).toBe(2);
    expect(result.stderr).toContain("groups accepts at most one path.");
  });

  it("preserves literal strings for text properties", async () => {
    const result = await runCli([
      "property:set",
      "--uuid",
      "record-existing-1",
      "name=00123",
      "comment=true",
      "path=null"
    ]);

    expect(result.code).toBe(0);
    expect(parseJsonOutput(result.stdout)).toEqual(
      expect.objectContaining({
        name: "00123",
        comment: "true",
        path: "null"
      })
    );
  });

  it("requires a record type when creating a record", async () => {
    const result = await runCli([
      "create:record",
      '{"name":"Scratch"}',
      "--db",
      "01. Personal",
      "--at",
      "/Projects"
    ]);

    expect(result.code).toBe(2);
    expect(result.stderr).toContain(
      "create:record requires 'type' or 'record type' in the JSON."
    );
  });
});
