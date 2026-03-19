import { ValidationError } from "../application/errors.js";
import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  parseArgs
} from "../utils/args.js";
import { buildGroupRef } from "../utils/locators.js";
import { renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class IndexCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "index";
  readonly category = "Other";
  readonly description = "Index a file or folder without copying it.";

  help(): string {
    return [
      "Usage: dt index <path> [--db <name|uuid>] [--at <path>]",
      "",
      "Index a file or folder (including subfolders) without copying.",
      "Not supported by revision-proof databases.",
      "",
      "Options:",
      "  --db <name|uuid>   Destination database",
      "  --at <path>        Destination group path",
      "",
      "Examples:",
      '  dt index ~/Documents/reference/ --db "01. Personal" --at "/Projects"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["db", "at"]);
    assertNoMissingOptionValues(parsed, ["db", "at"]);

    const path = parsed.positionals[0];
    if (!path) {
      throw new ValidationError("Missing required file path.");
    }
    if (parsed.positionals.length > 1) {
      throw new ValidationError("index accepts only one file path.");
    }

    const to = buildGroupRef(parsed, "db", "at");
    const parameters: Record<string, PropertyValue> = {};
    if (to) parameters.to = to;

    return {
      commandName: "index path",
      directValue: path,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
