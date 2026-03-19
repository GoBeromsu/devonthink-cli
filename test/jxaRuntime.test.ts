import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { devonthinkSchema } from "../src/schema/index.js";

function loadRuntime() {
  const source = readFileSync(
    new URL("../src/adapters/jxa/devonthink.runtime.js", import.meta.url),
    "utf8"
  );
  const context: Record<string, unknown> = {
    console
  };

  runInNewContext(
    `${source}\n;globalThis.__runtime = { serializeEntity, serializeCommandResult };`,
    context
  );

  return context.__runtime as {
    serializeEntity: (entity: unknown, propertyRequest: unknown, schemaObjects: unknown) => unknown;
    serializeCommandResult: (entity: unknown, schemaObjects: unknown) => unknown;
  };
}

describe("JXA runtime serialization", () => {
  it("backfills fields that are missing from a partial properties bag", () => {
    const runtime = loadRuntime();
    const record = {
      properties: () => ({
        name: "Existing.pdf"
      }),
      name: () => "Existing.pdf",
      comment: () => "seed",
      tags: () => ["reference"],
      recordType: () => "PDF document",
      uuid: () => "record-existing-1",
      location: () => "/Projects",
      path: () => "/Users/beomsu/Downloads/Existing.pdf"
    };

    expect(
      runtime.serializeEntity(
        record,
        {
          propertySpecs: devonthinkSchema.objects.record.properties,
          selectedProperties: null
        },
        devonthinkSchema.objects
      )
    ).toEqual(
      expect.objectContaining({
        name: "Existing.pdf",
        comment: "seed",
        tags: ["reference"]
      })
    );
  });

  it("serializes top-level command results with the full schema-backed shape", () => {
    const runtime = loadRuntime();
    const record = {
      properties: () => ({
        name: "Existing.pdf"
      }),
      name: () => "Existing.pdf",
      comment: () => "seed",
      tags: () => ["reference"],
      recordType: () => "PDF document",
      uuid: () => "record-existing-1",
      location: () => "/Projects",
      path: () => "/Users/beomsu/Downloads/Existing.pdf"
    };

    expect(
      runtime.serializeCommandResult(record, devonthinkSchema.objects)
    ).toEqual(
      expect.objectContaining({
        name: "Existing.pdf",
        comment: "seed",
        tags: ["reference"],
        "record type": "PDF document"
      })
    );
  });
});
