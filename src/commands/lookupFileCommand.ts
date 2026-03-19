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

export class LookupFileCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "lookup:file";
  readonly category = "Lookup";
  readonly description = "Find records by filename.";

  help(): string {
    return [
      "Usage: dt lookup:file <filename> [--db <name|uuid>]",
      "",
      "Lookup records whose last path component matches the specified file.",
      "",
      "Options:",
      "  --db <name|uuid>   Limit search to a specific database",
      "",
      "Examples:",
      '  dt lookup:file "paper.pdf" --db "01. Personal"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["db"]);
    assertNoMissingOptionValues(parsed, ["db"]);

    const filename = parsed.positionals[0];
    if (!filename) {
      throw new ValidationError("Missing required filename.");
    }
    if (parsed.positionals.length > 1) {
      throw new ValidationError("lookup:file accepts only one filename.");
    }

    const inRef = buildContainerRef(parsed, "db");
    const parameters: Record<string, PropertyValue> = {};
    if (inRef) parameters.in = inRef;

    return {
      commandName: "lookup records with file",
      directValue: filename,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
