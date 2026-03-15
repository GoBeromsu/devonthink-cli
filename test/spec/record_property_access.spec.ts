import { describe, expect, it } from "vitest";
import { parseJsonOutput, runCli } from "./helpers.js";

describe("record property access executable spec", () => {
  it("gets requested record properties and updates only official writable properties", async () => {
    const initial = await runCli([
      "record",
      "get",
      "--uuid",
      "record-existing-1",
      "--property",
      "name",
      "--property",
      "tags",
      "--property",
      "comment"
    ]);

    expect(initial.code).toBe(0);
    expect(parseJsonOutput(initial.stdout)).toEqual({
      name: "Existing.pdf",
      tags: ["reference"],
      comment: "seed"
    });

    const updated = await runCli([
      "record",
      "set",
      "--uuid",
      "record-existing-1",
      "--set",
      "comment=Reviewed",
      "--set",
      "tags=reference,reviewed"
    ], initial.port);

    expect(updated.code).toBe(0);
    expect(parseJsonOutput(updated.stdout)).toEqual(
      expect.objectContaining({
        comment: "Reviewed",
        tags: ["reference", "reviewed"]
      })
    );
  });
});
