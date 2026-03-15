import { ValidationError } from "../application/errors.js";
import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import { assertNoUnknownOptions, parseArgs } from "../utils/args.js";
import { buildContainerRef } from "../utils/locators.js";
import { renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class LookupPathCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "lookup:path";
  readonly category = "Lookup";
  readonly description = "Find records by file path.";

  help(): string {
    return [
      "Usage: dt lookup:path <path> [--db <name|uuid>]",
      "",
      "Lookup records with the specified POSIX path.",
      "",
      "Options:",
      "  --db <name|uuid>   Limit search to a specific database",
      "",
      "Examples:",
      '  dt lookup:path "/Users/beomsu/Downloads/paper.pdf" --db "01. Personal"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["db"]);

    const path = parsed.positionals[0];
    if (!path) {
      throw new ValidationError("Missing required path.");
    }
    if (parsed.positionals.length > 1) {
      throw new ValidationError("lookup:path accepts only one path.");
    }

    const inRef = buildContainerRef(parsed, "db");
    const parameters: Record<string, PropertyValue> = {};
    if (inRef) parameters.in = inRef;

    return {
      commandName: "lookup records with path",
      directValue: path,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
