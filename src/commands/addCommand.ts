import { ValidationError } from "../application/errors.js";
import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import { assertNoUnknownOptions, getOption, parseArgs } from "../utils/args.js";
import { buildGroupRef } from "../utils/locators.js";
import { renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class AddCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "add";
  readonly category = "Core";
  readonly description = "Import a file or folder into DEVONthink.";

  help(): string {
    return [
      "Usage: dt add <path> [--db <name|uuid>] [--at <path>] [--name <name>]",
      "",
      "Import a file or folder (including subfolders) into DEVONthink.",
      "",
      "Options:",
      "  --db <name|uuid>   Destination database",
      "  --at <path>        Destination group path",
      "  --name <name>      Override the imported record name",
      "",
      "Examples:",
      '  dt add ~/Downloads/paper.pdf --db "01. Personal" --at "/Projects"',
      '  dt add ~/Documents/notes/ --db "01. Personal" --name "My Notes"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["db", "at", "name"]);

    const path = parsed.positionals[0];
    if (!path) {
      throw new ValidationError("Missing required file path.");
    }
    if (parsed.positionals.length > 1) {
      throw new ValidationError("add accepts only one file path.");
    }

    const to = buildGroupRef(parsed, "db", "at");
    const name = getOption(parsed, "name");
    const parameters: Record<string, PropertyValue> = {};
    if (to) parameters.to = to;
    if (name) parameters.name = name;

    return {
      commandName: "import path",
      directValue: path,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
