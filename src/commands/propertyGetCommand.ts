import { ValidationError } from "../application/errors.js";
import type { SchemaObjectKind } from "../application/types.js";
import { assertNoUnknownOptions, getOption, parseArgs } from "../utils/args.js";
import { renderJson, validateProperties } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

type EntityMode = "application" | "database" | "group" | "record";

interface PropertyGetInput {
  mode: EntityMode;
  uuid?: string;
  db?: string;
  at?: string;
  properties: string[];
}

export class PropertyGetCommand implements CommandModule<PropertyGetInput> {
  readonly name = "property:get";
  readonly category = "Property";
  readonly description = "Read properties from any entity.";

  help(): string {
    return [
      "Usage:",
      "  dt property:get [locator] <property> [<property> ...]",
      "",
      "Locator determines entity type:",
      "  --uuid <uuid>             Record",
      "  --db <name|uuid> --at <path>  Group",
      "  --db <name|uuid>          Database",
      "  (none)                    Application",
      "",
      "Property names are positional arguments.",
      "",
      "Examples:",
      '  dt property:get inbox "incoming group"',
      "  dt property:get --uuid ABC-123 name tags comment",
      '  dt property:get --db "01. Personal" path root',
      '  dt property:get --db "01. Personal" --at "/Projects" name comment'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): PropertyGetInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["uuid", "db", "at"]);

    const uuid = getOption(parsed, "uuid");
    const db = getOption(parsed, "db");
    const at = getOption(parsed, "at");

    const mode = resolveMode(uuid, db, at);
    const kind: SchemaObjectKind = mode;
    const properties = context
      ? validateProperties(context.schema, kind, parsed.positionals)
      : parsed.positionals;

    return { mode, uuid, db, at, properties };
  }

  async execute(input: PropertyGetInput, context: CommandContext): Promise<void> {
    let result;

    switch (input.mode) {
      case "record":
        result = await context.devonthink.getRecord({
          locator: { uuid: input.uuid, database: input.db ? { identifier: input.db } : undefined, at: input.at },
          properties: input.properties
        });
        break;
      case "group":
        result = await context.devonthink.getGroup({
          locator: { database: { identifier: input.db! }, at: input.at },
          properties: input.properties
        });
        break;
      case "database":
        result = await context.devonthink.getDatabase({
          locator: { identifier: input.db! },
          properties: input.properties
        });
        break;
      case "application":
        result = await context.devonthink.getApplication({
          properties: input.properties
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
  return "application";
}
