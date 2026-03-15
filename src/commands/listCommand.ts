import { assertNoUnknownOptions, getOption, parseArgs } from "../utils/args.js";
import { renderJson, validateProperties } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";
import type { SchemaObjectKind } from "../application/types.js";

interface ListInput {
  mode: "databases" | "groups";
  db?: string;
  at?: string;
  properties: string[];
}

export class ListCommand implements CommandModule<ListInput> {
  readonly name = "list";
  readonly category = "Core";
  readonly description = "List databases or groups.";

  help(): string {
    return [
      "Usage:",
      "  dt list [--property <name> ...]",
      "  dt list --db <name|uuid> [/path] [--property <name> ...]",
      "",
      "Without --db, lists all databases.",
      "With --db, lists child groups of the database root or the specified path.",
      "",
      "Options:",
      "  --db <name|uuid>   Database to list groups in",
      "  --property <name>  Select specific properties to include",
      "",
      "Examples:",
      "  dt list",
      '  dt list --db "01. Personal"',
      '  dt list --db "01. Personal" /Projects'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): ListInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["db", "property"]);

    const db = getOption(parsed, "db");
    const at = parsed.positionals[0];
    const mode = db ? "groups" : "databases";
    const kind: SchemaObjectKind = mode === "databases" ? "database" : "group";
    const properties = context
      ? validateProperties(context.schema, kind, parsed.options.get("property") ?? [])
      : parsed.options.get("property") ?? [];

    return { mode, db, at, properties };
  }

  async execute(input: ListInput, context: CommandContext): Promise<void> {
    if (input.mode === "databases") {
      const result = await context.devonthink.listDatabases({
        properties: input.properties
      });
      context.output.write(renderJson(result));
      return;
    }

    const result = await context.devonthink.listGroups({
      locator: {
        database: { identifier: input.db! },
        at: input.at
      },
      properties: input.properties
    });
    context.output.write(renderJson(result));
  }
}
