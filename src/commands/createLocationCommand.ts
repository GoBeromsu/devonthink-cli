import { ValidationError } from "../application/errors.js";
import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import { assertNoUnknownOptions, parseArgs } from "../utils/args.js";
import { buildContainerRef } from "../utils/locators.js";
import { renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class CreateLocationCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "create:location";
  readonly category = "Create";
  readonly description = "Create a hierarchy of groups.";

  help(): string {
    return [
      "Usage: dt create:location <path> [--db <name|uuid>]",
      "",
      "Create a hierarchy of groups if necessary.",
      "",
      "Options:",
      "  --db <name|uuid>   Destination database",
      "",
      "Examples:",
      '  dt create:location "/Projects/2026/Papers" --db "01. Personal"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["db"]);

    const path = parsed.positionals[0];
    if (!path) {
      throw new ValidationError("Missing required location path.");
    }
    if (parsed.positionals.length > 1) {
      throw new ValidationError("create:location accepts only one path.");
    }

    const inRef = buildContainerRef(parsed, "db");
    const parameters: Record<string, PropertyValue> = {};
    if (inRef) parameters.in = inRef;

    return {
      commandName: "create location",
      directValue: path,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
