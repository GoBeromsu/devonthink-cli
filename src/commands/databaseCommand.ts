import { ValidationError } from "../application/errors.js";
import type { JsonValue } from "../application/types.js";
import { assertNoUnknownOptions, parseArgs } from "../utils/args.js";
import { databaseSelectorFromNameOrUuid } from "../utils/locators.js";
import {
  parseSetExpressions,
  renderJson,
  validateProperties
} from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

type DatabaseInput =
  | {
      action: "list";
      properties: string[];
    }
  | {
      action: "get";
      locator: ReturnType<typeof databaseSelectorFromNameOrUuid>;
      properties: string[];
    }
  | {
      action: "set";
      locator: ReturnType<typeof databaseSelectorFromNameOrUuid>;
      properties: string[];
      values: Record<string, JsonValue>;
    };

export class DatabaseCommand implements CommandModule<DatabaseInput> {
  readonly name = "database";
  readonly description = "List, get, or set database properties.";

  help(): string {
    return [
      "Usage:",
      "  dt database list [--property <name> ...]",
      "  dt database get (--name <name> | --uuid <uuid>) [--property <name> ...]",
      '  dt database set (--name <name> | --uuid <uuid>) --set "name=Archive" [--set "..."]',
      "",
      "Examples:",
      "  dt database list",
      '  dt database get --name "01. Personal" --property path --property root',
      '  dt database set --name "01. Personal" --set "comment=Reference DB"'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): DatabaseInput {
    const parsed = parseArgs(argv);
    const [action, ...rest] = parsed.positionals;

    if (action === "list") {
      if (rest.length > 0) {
        throw new ValidationError("database list does not accept positional arguments.");
      }
      assertNoUnknownOptions(parsed, ["property"]);
      return {
        action,
        properties: context
          ? validateProperties(context.schema, "database", parsed.options.get("property") ?? [])
          : parsed.options.get("property") ?? []
      };
    }

    if (action === "get" || action === "set") {
      if (rest.length > 0) {
        throw new ValidationError(`database ${action} does not accept positional arguments.`);
      }

      const locator = databaseSelectorFromNameOrUuid(parsed);
      assertNoUnknownOptions(
        parsed,
        action === "get" ? ["name", "uuid", "property"] : ["name", "uuid", "property", "set"]
      );
      const properties = context
        ? validateProperties(context.schema, "database", parsed.options.get("property") ?? [])
        : parsed.options.get("property") ?? [];

      if (action === "get") {
        return {
          action,
          locator,
          properties
        };
      }

      if (!context) {
        throw new ValidationError("database set parsing requires command context.");
      }

      return {
        action,
        locator,
        properties,
        values: parseSetExpressions(
          context.schema,
          "database",
          parsed.options.get("set") ?? []
        )
      };
    }

    throw new ValidationError("database requires one of: list, get, set.");
  }

  async execute(input: DatabaseInput, context: CommandContext): Promise<void> {
    if (input.action === "list") {
      const result = await context.devonthink.listDatabases({
        properties: input.properties
      });
      context.output.write(renderJson(result));
      return;
    }

    if (input.action === "get") {
      const result = await context.devonthink.getDatabase({
        locator: input.locator,
        properties: input.properties
      });
      context.output.write(renderJson(result));
      return;
    }

    const result = await context.devonthink.setDatabase({
      locator: input.locator,
      properties: input.properties,
      values: input.values
    });
    context.output.write(renderJson(result));
  }
}
