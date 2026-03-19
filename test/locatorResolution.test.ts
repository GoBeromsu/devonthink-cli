import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/utils/args.js";
import {
  databaseSelectorFromIdentifier,
  databaseSelectorFromNameOrUuid,
  groupSelectorFromDatabaseOption,
  recordSelectorFromUuidOrPath
} from "../src/utils/locators.js";

describe("locator resolution helpers", () => {
  it("parses database locators by name or uuid", () => {
    expect(databaseSelectorFromNameOrUuid(parseArgs(["--name", "Inbox"]))).toEqual({
      name: "Inbox",
      uuid: undefined
    });
    expect(databaseSelectorFromNameOrUuid(parseArgs(["--uuid", "db-1"]))).toEqual({
      name: undefined,
      uuid: "db-1"
    });
  });

  it("parses group locators from database identifiers and paths", () => {
    expect(
      groupSelectorFromDatabaseOption(
        parseArgs(["--database", "01. Personal", "--at", "/Projects"])
      )
    ).toEqual({
      database: { identifier: "01. Personal" },
      at: "/Projects"
    });
  });

  it("parses record locators from uuid or DEVONthink path", () => {
    expect(recordSelectorFromUuidOrPath(parseArgs(["--uuid", "record-1"]))).toEqual({
      uuid: "record-1",
      database: undefined
    });
    expect(
      recordSelectorFromUuidOrPath(
        parseArgs(["--database", "01. Personal", "--at", "/Projects/Existing.pdf"])
      )
    ).toEqual({
      database: { identifier: "01. Personal" },
      at: "/Projects/Existing.pdf"
    });
    expect(databaseSelectorFromIdentifier(parseArgs(["--database", "Inbox"]))).toEqual({
      identifier: "Inbox"
    });
  });

  it("rejects conflicting record locators", () => {
    expect(() =>
      recordSelectorFromUuidOrPath(
        parseArgs(["--uuid", "record-1", "--database", "01. Personal", "--at", "/Projects"])
      )
    ).toThrow("Record locator accepts either --uuid or --database with --at, not both.");
  });
});
