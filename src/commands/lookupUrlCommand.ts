import { ValidationError } from "../application/errors.js";
import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  parseArgs
} from "../utils/args.js";
import { buildContainerRef } from "../utils/locators.js";
import { renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class LookupUrlCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "lookup:url";
  readonly category = "Lookup";
  readonly description = "Find records by URL.";

  help(): string {
    return [
      "Usage: dt lookup:url <url> [--db <name|uuid>]",
      "",
      "Lookup records with the specified URL.",
      "",
      "Options:",
      "  --db <name|uuid>   Limit search to a specific database",
      "",
      "Examples:",
      '  dt lookup:url "https://example.com/article" --db "01. Personal"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["db"]);
    assertNoMissingOptionValues(parsed, ["db"]);

    const url = parsed.positionals[0];
    if (!url) {
      throw new ValidationError("Missing required URL.");
    }
    if (parsed.positionals.length > 1) {
      throw new ValidationError("lookup:url accepts only one URL.");
    }

    const inRef = buildContainerRef(parsed, "db");
    const parameters: Record<string, PropertyValue> = {};
    if (inRef) parameters.in = inRef;

    return {
      commandName: "lookup records with URL",
      directValue: url,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
