import { ValidationError } from "../application/errors.js";
import type { JsonValue } from "../application/types.js";
import { assertNoUnknownOptions, parseArgs } from "../utils/args.js";
import { recordSelectorFromUuidOrPath } from "../utils/locators.js";
import {
  parseSetExpressions,
  renderJson,
  validateProperties
} from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

type RecordInput =
  | {
      action: "get";
      locator: ReturnType<typeof recordSelectorFromUuidOrPath>;
      properties: string[];
    }
  | {
      action: "set";
      locator: ReturnType<typeof recordSelectorFromUuidOrPath>;
      properties: string[];
      values: Record<string, JsonValue>;
    };

export class RecordCommand implements CommandModule<RecordInput> {
  readonly name = "record";
  readonly description = "Get or set record properties.";

  help(): string {
    return [
      "Usage:",
      "  dt record get (--uuid <uuid> | --database <name|uuid> --at <path>) [--property <name> ...]",
      '  dt record set (--uuid <uuid> | --database <name|uuid> --at <path>) --set "tags=a,b"',
      "",
      "Examples:",
      '  dt record get --database "01. Personal" --at "/Projects/Report.pdf"',
      '  dt record set --uuid ABC-123 --set "comment=Reviewed" --set "tags=project,review"'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): RecordInput {
    const parsed = parseArgs(argv);
    const [action, ...rest] = parsed.positionals;

    if (action === "get" || action === "set") {
      if (rest.length > 0) {
        throw new ValidationError(`record ${action} does not accept positional arguments.`);
      }

      assertNoUnknownOptions(
        parsed,
        action === "set"
          ? ["uuid", "database", "at", "property", "set"]
          : ["uuid", "database", "at", "property"]
      );
      const locator = recordSelectorFromUuidOrPath(parsed);
      const properties = context
        ? validateProperties(context.schema, "record", parsed.options.get("property") ?? [])
        : parsed.options.get("property") ?? [];

      if (action === "get") {
        return {
          action,
          locator,
          properties
        };
      }

      if (!context) {
        throw new ValidationError("record set parsing requires command context.");
      }

      return {
        action,
        locator,
        properties,
        values: parseSetExpressions(
          context.schema,
          "record",
          parsed.options.get("set") ?? []
        )
      };
    }

    throw new ValidationError("record requires one of: get, set.");
  }

  async execute(input: RecordInput, context: CommandContext): Promise<void> {
    if (input.action === "get") {
      const result = await context.devonthink.getRecord({
        locator: input.locator,
        properties: input.properties
      });
      context.output.write(renderJson(result));
      return;
    }

    const result = await context.devonthink.setRecord({
      locator: input.locator,
      properties: input.properties,
      values: input.values
    });
    context.output.write(renderJson(result));
  }
}
