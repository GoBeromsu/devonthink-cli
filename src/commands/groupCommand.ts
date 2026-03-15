import { ValidationError } from "../application/errors.js";
import type { JsonValue } from "../application/types.js";
import { assertNoUnknownOptions, parseArgs } from "../utils/args.js";
import { groupSelectorFromDatabaseOption } from "../utils/locators.js";
import {
  parseSetExpressions,
  renderJson,
  validateProperties
} from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

type GroupInput =
  | {
      action: "list";
      locator: ReturnType<typeof groupSelectorFromDatabaseOption>;
      properties: string[];
    }
  | {
      action: "get";
      locator: ReturnType<typeof groupSelectorFromDatabaseOption>;
      properties: string[];
    }
  | {
      action: "set";
      locator: ReturnType<typeof groupSelectorFromDatabaseOption>;
      properties: string[];
      values: Record<string, JsonValue>;
    };

export class GroupCommand implements CommandModule<GroupInput> {
  readonly name = "group";
  readonly description = "List, get, or set parent/group objects.";

  help(): string {
    return [
      "Usage:",
      "  dt group list --database <name|uuid> [--at <path>] [--property <name> ...]",
      "  dt group get --database <name|uuid> --at <path> [--property <name> ...]",
      '  dt group set --database <name|uuid> --at <path> --set "color=[65535,0,0]"',
      "",
      "Examples:",
      '  dt group list --database "01. Personal" --at "/Projects"',
      '  dt group get --database "01. Personal" --at "/Projects/Inbox"',
      '  dt group set --database "01. Personal" --at "/Projects" --set "comment=Focus area"'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): GroupInput {
    const parsed = parseArgs(argv);
    const [action, ...rest] = parsed.positionals;

    if (action === "list" || action === "get" || action === "set") {
      if (rest.length > 0) {
        throw new ValidationError(`group ${action} does not accept positional arguments.`);
      }

      const requireAt = action !== "list";
      assertNoUnknownOptions(
        parsed,
        action === "set"
          ? ["database", "at", "property", "set"]
          : ["database", "at", "property"]
      );
      const locator = groupSelectorFromDatabaseOption(parsed, {
        requireAt,
        label: "group"
      });
      const properties = context
        ? validateProperties(context.schema, "group", parsed.options.get("property") ?? [])
        : parsed.options.get("property") ?? [];

      if (action === "list" || action === "get") {
        return {
          action,
          locator,
          properties
        };
      }

      if (!context) {
        throw new ValidationError("group set parsing requires command context.");
      }

      return {
        action,
        locator,
        properties,
        values: parseSetExpressions(
          context.schema,
          "group",
          parsed.options.get("set") ?? []
        )
      };
    }

    throw new ValidationError("group requires one of: list, get, set.");
  }

  async execute(input: GroupInput, context: CommandContext): Promise<void> {
    if (input.action === "list") {
      const result = await context.devonthink.listGroups({
        locator: input.locator,
        properties: input.properties
      });
      context.output.write(renderJson(result));
      return;
    }

    if (input.action === "get") {
      const result = await context.devonthink.getGroup({
        locator: input.locator,
        properties: input.properties
      });
      context.output.write(renderJson(result));
      return;
    }

    const result = await context.devonthink.setGroup({
      locator: input.locator,
      properties: input.properties,
      values: input.values
    });
    context.output.write(renderJson(result));
  }
}
