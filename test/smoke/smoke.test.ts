/**
 * Live smoke tests against a real DEVONthink instance.
 *
 * Prerequisites:
 *   1. DEVONthink 4.x must be running
 *   2. A database named "dt-cli-smoke" must be open
 *
 * Run: pnpm test:smoke
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTempDir,
  createTempFile,
  dt,
  parseJson,
  SMOKE_DB,
  timestamp
} from "./helpers.js";

const TAG = timestamp();
const SMOKE_ROOT = `/Smoke/${TAG}`;

let importedUuid: string | undefined;
let tempDir: string | undefined;

describe("live smoke: full workflow", () => {
  beforeAll(async () => {
    // Verify DEVONthink is reachable and the smoke database exists
    const result = await dt(["databases"]);
    expect(result.code).toBe(0);

    const databases = parseJson(result.stdout) as Array<{ name: string }>;
    const smokeDb = databases.find((db) => db.name === SMOKE_DB);
    if (!smokeDb) {
      throw new Error(
        `Smoke database "${SMOKE_DB}" not found. ` +
        `Create it in DEVONthink before running smoke tests. ` +
        `Found: ${databases.map((db) => db.name).join(", ")}`
      );
    }
  });

  afterAll(async () => {
    // Best-effort cleanup: delete the smoke root group
    // The group delete cascades to child records in DEVONthink
    try {
      const groupResult = await dt([
        "get",
        "--db", SMOKE_DB,
        "--at", SMOKE_ROOT
      ]);
      if (groupResult.code === 0) {
        const group = parseJson(groupResult.stdout) as { uuid: string };
        await dt(["delete", "--uuid", group.uuid]);
      }
    } catch {
      // Cleanup failure is not a test failure
    }

    if (tempDir) {
      await cleanupTempDir(tempDir);
    }
  });

  it("1. databases — smoke database is listed", async () => {
    const result = await dt(["databases"]);
    expect(result.code).toBe(0);

    const databases = parseJson(result.stdout) as Array<{ name: string }>;
    expect(databases.some((db) => db.name === SMOKE_DB)).toBe(true);
  });

  it("2. create:group — creates smoke group hierarchy", async () => {
    const result = await dt([
      "create:group",
      SMOKE_ROOT,
      "--db", SMOKE_DB
    ]);
    expect(result.code).toBe(0);

    const group = parseJson(result.stdout) as { name: string; uuid: string };
    expect(group.name).toBe(TAG);
    expect(group.uuid).toBeTruthy();
  });

  it("3. groups — smoke group is visible", async () => {
    const result = await dt([
      "groups",
      "--db", SMOKE_DB,
      "/Smoke"
    ]);
    expect(result.code).toBe(0);

    const groups = parseJson(result.stdout) as Array<{ name: string }>;
    expect(groups.some((g) => g.name === TAG)).toBe(true);
  });

  it("4. add — imports a temp file into smoke group", async () => {
    const tmp = await createTempFile(`smoke-${TAG}.txt`);
    tempDir = tmp.dir;

    const result = await dt([
      "add",
      tmp.file,
      "--db", SMOKE_DB,
      "--at", SMOKE_ROOT
    ]);
    expect(result.code).toBe(0);

    const record = parseJson(result.stdout) as { name: string; uuid: string };
    expect(record.uuid).toBeTruthy();
    importedUuid = record.uuid;
  });

  it("5. get — retrieves imported record by UUID", async () => {
    expect(importedUuid).toBeTruthy();

    const result = await dt(["get", "--uuid", importedUuid!]);
    expect(result.code).toBe(0);

    const record = parseJson(result.stdout) as { uuid: string; name: string };
    expect(record.uuid).toBe(importedUuid);
  });

  it("6. property:set — sets comment on imported record", async () => {
    expect(importedUuid).toBeTruthy();

    const result = await dt([
      "property:set",
      "--uuid", importedUuid!,
      `comment=smoke-${TAG}`
    ]);
    expect(result.code).toBe(0);

    const record = parseJson(result.stdout) as { comment: string };
    expect(record.comment).toBe(`smoke-${TAG}`);
  });

  it("7. property:read — reads comment back", async () => {
    expect(importedUuid).toBeTruthy();

    const result = await dt([
      "property:read",
      "--uuid", importedUuid!,
      "comment"
    ]);
    expect(result.code).toBe(0);

    const props = parseJson(result.stdout) as { comment: string };
    expect(props.comment).toBe(`smoke-${TAG}`);
  });

  it("8. search — finds record by comment", async () => {
    expect(importedUuid).toBeTruthy();

    const result = await dt([
      "search",
      `smoke-${TAG}`,
      "--db", SMOKE_DB
    ]);
    expect(result.code).toBe(0);

    const records = parseJson(result.stdout) as Array<{ uuid: string }>;
    expect(records.some((r) => r.uuid === importedUuid)).toBe(true);
  });

  it("9. move — moves record to an Archive subgroup", async () => {
    expect(importedUuid).toBeTruthy();

    // Create archive subgroup first
    const createResult = await dt([
      "create:group",
      `${SMOKE_ROOT}/Archive`,
      "--db", SMOKE_DB
    ]);
    expect(createResult.code).toBe(0);

    const moveResult = await dt([
      "move",
      "--uuid", importedUuid!,
      "--to-db", SMOKE_DB,
      "--to", `${SMOKE_ROOT}/Archive`
    ]);
    expect(moveResult.code).toBe(0);
  });

  it("10. delete — deletes the imported record", async () => {
    expect(importedUuid).toBeTruthy();

    const result = await dt(["delete", "--uuid", importedUuid!]);
    expect(result.code).toBe(0);
    importedUuid = undefined;
  });
});
