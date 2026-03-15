import { assertNoUnknownOptions, getOption, parseArgs } from "../utils/args.js";
import { ValidationError } from "../application/errors.js";
import { renderJson, validateProperties } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface GroupsInput {
  db: string;
  at?: string;
  properties: string[];
}

export class GroupsCommand implements CommandModule<GroupsInput> {
  readonly name = "groups";
  readonly category = "Core";
  readonly description = "List child groups in a database.";

  help(): string {
    return [
      "Usage: dt groups --db <name|uuid> [/path] [--property <name> ...]",
      "",
      "List child groups of the database root or the specified path.",
      "",
      "Options:",
      "  --db <name|uuid>   Database to list groups in (required)",
      "  --property <name>  Select specific properties to include",
      "",
      "Examples:",
      '  dt groups --db "01. Personal"',
      '  dt groups --db "01. Personal" /Projects'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): GroupsInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["db", "property"]);

    const db = getOption(parsed, "db");
    if (!db) {
      throw new ValidationError("groups requires --db.");
    }

    const at = parsed.positionals[0];
    const properties = context
      ? validateProperties(context.schema, "group", parsed.options.get("property") ?? [])
      : parsed.options.get("property") ?? [];

    return { db, at, properties };
  }

  async execute(input: GroupsInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.listGroups({
      locator: {
        database: { identifier: input.db },
        at: input.at
      },
      properties: input.properties
    });
    context.output.write(renderJson(result));
  }
}
