/**
 * Extended smoke tests covering create:record, lookup, duplicate, replicate, and AI commands.
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
const SMOKE_ROOT = `/SmokeExt/${TAG}`;

const uuidsToCleanup: string[] = [];
let tempDir: string | undefined;

describe("live smoke: extended commands", () => {
  beforeAll(async () => {
    const result = await dt(["databases"]);
    expect(result.code).toBe(0);

    const databases = parseJson(result.stdout) as Array<{ name: string }>;
    if (!databases.some((db) => db.name === SMOKE_DB)) {
      throw new Error(`Smoke database "${SMOKE_DB}" not found.`);
    }

    // Create root group for this run
    const group = await dt(["create:group", SMOKE_ROOT, "--db", SMOKE_DB]);
    expect(group.code).toBe(0);
  });

  afterAll(async () => {
    // Delete tracked records
    for (const uuid of uuidsToCleanup) {
      try {
        await dt(["delete", "--uuid", uuid]);
      } catch {
        // best-effort
      }
    }

    // Delete root group
    try {
      const groupResult = await dt(["get", "--db", SMOKE_DB, "--at", SMOKE_ROOT]);
      if (groupResult.code === 0) {
        const group = parseJson(groupResult.stdout) as { uuid: string };
        await dt(["delete", "--uuid", group.uuid]);
      }
    } catch {
      // best-effort
    }

    if (tempDir) {
      await cleanupTempDir(tempDir);
    }
  });

  it("create:record — creates a markdown record", async () => {
    const result = await dt([
      "create:record",
      JSON.stringify({ name: `note-${TAG}`, type: "markdown", tags: ["smoke"] }),
      "--db", SMOKE_DB,
      "--at", SMOKE_ROOT
    ]);
    expect(result.code).toBe(0);

    const record = parseJson(result.stdout) as { name: string; uuid: string };
    expect(record.name).toBe(`note-${TAG}`);
    expect(record.uuid).toBeTruthy();
    uuidsToCleanup.push(record.uuid);
  });

  it("lookup:file — finds an imported file by name", async () => {
    const tmp = await createTempFile(`findme-${TAG}.txt`);
    tempDir = tmp.dir;

    const addResult = await dt([
      "add", tmp.file,
      "--db", SMOKE_DB,
      "--at", SMOKE_ROOT
    ]);
    expect(addResult.code).toBe(0);
    const added = parseJson(addResult.stdout) as { uuid: string };
    uuidsToCleanup.push(added.uuid);

    const lookupResult = await dt([
      "lookup:file",
      `findme-${TAG}.txt`,
      "--db", SMOKE_DB
    ]);
    expect(lookupResult.code).toBe(0);

    const records = parseJson(lookupResult.stdout) as Array<{ uuid: string }>;
    expect(records.some((r) => r.uuid === added.uuid)).toBe(true);
  });

  it("lookup:tags — finds records by tag", async () => {
    // The create:record test above tagged a record with "smoke"
    const result = await dt([
      "lookup:tags",
      "smoke",
      "--db", SMOKE_DB
    ]);
    expect(result.code).toBe(0);

    const records = parseJson(result.stdout) as Array<{ name: string }>;
    expect(records.some((r) => r.name === `note-${TAG}`)).toBe(true);
  });

  it("duplicate — duplicates a record to another group", async () => {
    // Create a destination subgroup
    const subResult = await dt([
      "create:group",
      `${SMOKE_ROOT}/Copies`,
      "--db", SMOKE_DB
    ]);
    expect(subResult.code).toBe(0);

    // Find a record to duplicate (the note from create:record test)
    const searchResult = await dt([
      "search",
      `note-${TAG}`,
      "--db", SMOKE_DB
    ]);
    expect(searchResult.code).toBe(0);
    const records = parseJson(searchResult.stdout) as Array<{ uuid: string }>;
    const source = records[0];
    expect(source).toBeTruthy();

    const dupResult = await dt([
      "duplicate",
      "--uuid", source!.uuid,
      "--to-db", SMOKE_DB,
      "--to", `${SMOKE_ROOT}/Copies`
    ]);
    expect(dupResult.code).toBe(0);

    const duplicated = parseJson(dupResult.stdout) as { uuid: string; name: string };
    expect(duplicated.name).toBe(`note-${TAG}`);
    // Duplicate gets a new UUID
    expect(duplicated.uuid).not.toBe(source!.uuid);
    uuidsToCleanup.push(duplicated.uuid);
  });

  it("replicate — replicates a record to another group", async () => {
    const subResult = await dt([
      "create:group",
      `${SMOKE_ROOT}/Replicas`,
      "--db", SMOKE_DB
    ]);
    expect(subResult.code).toBe(0);

    const searchResult = await dt([
      "search",
      `note-${TAG}`,
      "--db", SMOKE_DB
    ]);
    expect(searchResult.code).toBe(0);
    const records = parseJson(searchResult.stdout) as Array<{ uuid: string }>;
    const source = records[0];
    expect(source).toBeTruthy();

    const repResult = await dt([
      "replicate",
      "--uuid", source!.uuid,
      "--to-db", SMOKE_DB,
      "--to", `${SMOKE_ROOT}/Replicas`
    ]);
    expect(repResult.code).toBe(0);

    const replicated = parseJson(repResult.stdout) as { uuid: string; name: string };
    expect(replicated.name).toBe(`note-${TAG}`);
    // Replicate keeps the same UUID
    expect(replicated.uuid).toBe(source!.uuid);
  });

  it("ai:classify — classifies a record into suggested groups", async () => {
    const searchResult = await dt([
      "search",
      `note-${TAG}`,
      "--db", SMOKE_DB
    ]);
    expect(searchResult.code).toBe(0);
    const records = parseJson(searchResult.stdout) as Array<{ uuid: string }>;
    const source = records[0];
    expect(source).toBeTruthy();

    const result = await dt([
      "ai:classify",
      "--uuid", source!.uuid,
      "--db", SMOKE_DB
    ]);
    expect(result.code).toBe(0);

    // Classify returns an array of suggested groups (may be empty for a new db)
    const suggestions = parseJson(result.stdout) as Array<unknown>;
    expect(Array.isArray(suggestions)).toBe(true);
  });

  it("ai:compare — finds similar records", async () => {
    const searchResult = await dt([
      "search",
      `note-${TAG}`,
      "--db", SMOKE_DB
    ]);
    expect(searchResult.code).toBe(0);
    const records = parseJson(searchResult.stdout) as Array<{ uuid: string }>;
    const source = records[0];
    expect(source).toBeTruthy();

    const result = await dt([
      "ai:compare",
      "--uuid", source!.uuid
    ]);
    expect(result.code).toBe(0);

    const similar = parseJson(result.stdout) as Array<unknown>;
    expect(Array.isArray(similar)).toBe(true);
  });
});
