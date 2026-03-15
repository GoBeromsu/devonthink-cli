import { describe, expect, it } from "vitest";
import { JxaDevonthinkAdapter } from "../src/adapters/jxa/JxaDevonthinkAdapter.js";
import { NotFoundError } from "../src/application/errors.js";
import { devonthinkSchema } from "../src/schema/index.js";
import type { ProcessRunner } from "../src/infrastructure/processRunner.js";

describe("JxaDevonthinkAdapter", () => {
  it("parses successful JSON responses from osascript", async () => {
    const runner: ProcessRunner = {
      run: async () => ({
        stdout: "",
        stderr: JSON.stringify({
          ok: true,
          result: [
            {
              name: "01. Personal",
              uuid: "db-1",
              path: "/tmp/01 Personal.dtBase2"
            }
          ]
        }),
        exitCode: 0
      })
    };

    const adapter = new JxaDevonthinkAdapter(runner, devonthinkSchema);
    await expect(adapter.listDatabases({})).resolves.toEqual([
      {
        name: "01. Personal",
        uuid: "db-1",
        path: "/tmp/01 Personal.dtBase2"
      }
    ]);
  });

  it("maps not-found JXA failures into typed application errors", async () => {
    const runner: ProcessRunner = {
      run: async () => ({
        stdout: JSON.stringify({
          ok: false,
          error: {
            code: "NOT_FOUND",
            message: "Record not found.",
            name: "Error"
          }
        }),
        stderr: "",
        exitCode: 0
      })
    };

    const adapter = new JxaDevonthinkAdapter(runner, devonthinkSchema);
    await expect(
      adapter.getRecord({ locator: { uuid: "missing" }, properties: [] })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
