import { describe, expect, it } from "vitest";
import { parseJsonOutput, runCli } from "./helpers.js";

describe("inbox database model executable spec", () => {
  it("treats the global inbox as an application/database property instead of a custom subsystem", async () => {
    const result = await runCli([
      "property:get",
      "inbox",
      "incoming group"
    ]);

    expect(result.code).toBe(0);
    expect(parseJsonOutput(result.stdout)).toEqual({
      inbox: {
        name: "Inbox",
        uuid: "db-inbox",
        path: "/Users/beomsu/Library/Application Support/DEVONthink/Inbox.dtBase2"
      },
      "incoming group": {
        name: "Inbox",
        uuid: "group-root-inbox",
        location: "/",
        path: null,
        "record type": "group"
      }
    });
  });
});
