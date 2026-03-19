import { ValidationError } from "../application/errors.js";
import type { JsonValue, SchemaObjectKind } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  parseArgs
} from "../utils/args.js";
import {
  ensureExclusiveRecordLocator,
  parseSetExpressions,
  renderJson
} from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

type EntityMode = "database" | "group" | "record";

interface PropertySetInput {
  mode: EntityMode;
  uuid?: string;
  db?: string;
  at?: string;
  values: Record<string, JsonValue>;
}

export class PropertySetCommand implements CommandModule<PropertySetInput> {
  readonly name = "property:set";
  readonly category = "Property";
  readonly description = "Write properties on any entity.";

  help(): string {
    return [
      "Usage:",
      "  dt property:set [locator] <key=value> [<key=value> ...]",
      "",
      "Locator determines entity type:",
      "  --uuid <uuid>                 Record",
      "  --db <name|uuid> --at <path>  Group",
      "  --db <name|uuid>              Database",
      "",
      "Assignments are positional arguments (key=value).",
      "",
      "Examples:",
      '  dt property:set --uuid ABC-123 tags=project,reading comment=Reviewed',
      '  dt property:set --db "01. Personal" --at "/Projects" comment="Focus area"',
      '  dt property:set --db "01. Personal" comment="Reference DB"'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): PropertySetInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["uuid", "db", "at"]);
    assertNoMissingOptionValues(parsed, ["uuid", "db", "at"]);

    const uuid = getOption(parsed, "uuid");
    const db = getOption(parsed, "db");
    const at = getOption(parsed, "at");
    ensureExclusiveRecordLocator(uuid, db, at, "property:set");

    const mode = resolveMode(uuid, db, at);
    const kind: SchemaObjectKind = mode;

    if (parsed.positionals.length === 0) {
      throw new ValidationError("At least one key=value assignment is required.");
    }

    const values = context
      ? parseSetExpressions(context.schema, kind, parsed.positionals)
      : Object.fromEntries(parsed.positionals.map((entry) => entry.split("=", 2) as [string, string]));

    return { mode, uuid, db, at, values };
  }

  async execute(input: PropertySetInput, context: CommandContext): Promise<void> {
    let result;

    switch (input.mode) {
      case "record":
        result = await context.devonthink.setRecord({
          locator: { uuid: input.uuid, database: input.db ? { identifier: input.db } : undefined, at: input.at },
          values: input.values
        });
        break;
      case "group":
        result = await context.devonthink.setGroup({
          locator: { database: { identifier: input.db! }, at: input.at },
          values: input.values
        });
        break;
      case "database":
        result = await context.devonthink.setDatabase({
          locator: { identifier: input.db! },
          values: input.values
        });
        break;
    }

    context.output.write(renderJson(result));
  }
}

function resolveMode(uuid?: string, db?: string, at?: string): EntityMode {
  if (uuid) return "record";
  if (db && at) return "group";
  if (db) return "database";
  if (at) throw new ValidationError("--at requires --db.");
  throw new ValidationError("property:set requires a locator (--uuid, --db, or --db --at).");
}
