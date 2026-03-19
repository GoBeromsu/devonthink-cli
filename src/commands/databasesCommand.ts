import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  parseArgs
} from "../utils/args.js";
import { renderJson, validateProperties } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface DatabasesInput {
  properties: string[];
}

export class DatabasesCommand implements CommandModule<DatabasesInput> {
  readonly name = "databases";
  readonly category = "Core";
  readonly description = "List open databases.";

  help(): string {
    return [
      "Usage: dt databases [--property <name> ...]",
      "",
      "List all open databases.",
      "",
      "Options:",
      "  --property <name>  Select specific properties to include",
      "",
      "Examples:",
      "  dt databases",
      '  dt databases --property name path'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): DatabasesInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["property"]);
    assertNoMissingOptionValues(parsed, ["property"]);

    const properties = context
      ? validateProperties(context.schema, "database", parsed.options.get("property") ?? [])
      : parsed.options.get("property") ?? [];

    return { properties };
  }

  async execute(input: DatabasesInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.listDatabases({
      properties: input.properties
    });
    context.output.write(renderJson(result));
  }
}
