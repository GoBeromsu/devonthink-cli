import { ValidationError } from "../application/errors.js";
import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  parseArgs
} from "../utils/args.js";
import { buildContainerRef } from "../utils/locators.js";
import { parseBooleanOption, renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class LookupTagsCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "lookup:tags";
  readonly category = "Lookup";
  readonly description = "Find records by tags.";

  help(): string {
    return [
      "Usage: dt lookup:tags <tag> [<tag> ...] [--any] [--db <name|uuid>]",
      "",
      "Lookup records with all (default) or any of the specified tags.",
      "",
      "Options:",
      "  --any              Match any tag instead of all",
      "  --db <name|uuid>   Limit search to a specific database",
      "",
      "Examples:",
      '  dt lookup:tags reading llm --any --db "01. Personal"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["db", "any"]);
    assertNoMissingOptionValues(parsed, ["db"]);

    if (parsed.positionals.length === 0) {
      throw new ValidationError("At least one tag is required.");
    }

    const tags = parsed.positionals;
    const inRef = buildContainerRef(parsed, "db");
    const any = parseBooleanOption(parsed, "any");
    const parameters: Record<string, PropertyValue> = {};
    if (inRef) parameters.in = inRef;
    if (any !== undefined) parameters.any = any;

    return {
      commandName: "lookup records with tags",
      directValue: tags,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
