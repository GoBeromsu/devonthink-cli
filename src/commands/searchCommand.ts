import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import { assertNoUnknownOptions, getOption, parseArgs } from "../utils/args.js";
import { buildGroupRef } from "../utils/locators.js";
import { parseBooleanOption, renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class SearchCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "search";
  readonly category = "Core";
  readonly description = "Search for records in DEVONthink.";

  help(): string {
    return [
      "Usage: dt search <query> [--db <name|uuid>] [--comparison <type>] [--exclude-subgroups]",
      "",
      "Search for records using DEVONthink's native search.",
      "",
      "Options:",
      "  --db <name|uuid>      Search within a specific database",
      "  --comparison <type>   Search comparison (default: no case)",
      "  --exclude-subgroups   Don't search in subgroups",
      "",
      "Examples:",
      '  dt search "tags:reference" --db "01. Personal"',
      '  dt search "name:paper" --comparison "no case"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["db", "at", "comparison", "exclude-subgroups"]);

    const query = parsed.positionals[0];
    const inRef = buildGroupRef(parsed, "db", "at");
    const comparison = getOption(parsed, "comparison");
    const excludeSubgroups = parseBooleanOption(parsed, "exclude-subgroups");
    const parameters: Record<string, PropertyValue> = {};
    if (inRef) parameters.in = inRef;
    if (comparison) parameters.comparison = comparison;
    if (excludeSubgroups !== undefined) parameters.excludeSubgroups = excludeSubgroups;

    return {
      commandName: "search",
      directValue: query,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
