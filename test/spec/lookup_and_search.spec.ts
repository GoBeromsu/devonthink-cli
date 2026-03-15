import { describe, expect, it } from "vitest";
import { parseJsonOutput, runCli } from "./helpers.js";

describe("lookup and search executable spec", () => {
  it("passes raw DEVONthink search and lookup inputs through unchanged", async () => {
    const result = await runCli([
      "search",
      "tags:llm",
      "--db",
      "01. Personal",
      "--exclude-subgroups",
      "--comparison",
      "no case"
    ]);

    expect(result.code).toBe(0);
    expect(parseJsonOutput(result.stdout)).toEqual([
      expect.objectContaining({
        name: "Article",
        tags: ["llm", "reference"]
      })
    ]);
    expect(result.port.state.commandCalls.at(-1)).toEqual({
      commandName: "search",
      directValue: "tags:llm",
      parameters: {
        comparison: "no case",
        excludeSubgroups: true,
        in: {
          $type: "group",
          locator: {
            database: { identifier: "01. Personal" },
            at: undefined
          }
        }
      }
    });

    const byFile = await runCli([
      "lookup:file",
      "Existing.pdf",
      "--db",
      "01. Personal"
    ], result.port);
    expect(byFile.code).toBe(0);
    expect(parseJsonOutput(byFile.stdout)).toEqual([
      expect.objectContaining({ name: "Existing.pdf" })
    ]);

    const byTags = await runCli([
      "lookup:tags",
      "llm",
      "reference",
      "--any",
      "--db",
      "01. Personal"
    ], result.port);
    expect(byTags.code).toBe(0);
    expect(parseJsonOutput(byTags.stdout)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Article" }),
        expect.objectContaining({ name: "Existing.pdf" })
      ])
    );
  });
});
