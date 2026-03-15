import { ValidationError } from "../application/errors.js";
import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import { assertNoUnknownOptions, parseArgs } from "../utils/args.js";
import { buildGroupRef } from "../utils/locators.js";
import { renderJson } from "./helpers.js";
import { parseJsonObject } from "../utils/values.js";
import type { CommandContext, CommandModule } from "./types.js";

export class CreateRecordCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "create:record";
  readonly category = "Create";
  readonly description = "Create a new record from a property dictionary.";

  help(): string {
    return [
      "Usage: dt create:record '<json>' [--db <name|uuid>] [--at <path>]",
      "",
      "Create a new record. At least 'type' or 'record type' is required in the JSON.",
      "",
      "Options:",
      "  --db <name|uuid>   Destination database",
      "  --at <path>        Destination group path",
      "",
      "Examples:",
      '  dt create:record \'{"name":"Scratch","type":"markdown","tags":["draft"]}\' --db "01. Personal" --at "/Projects"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["db", "at"]);

    const json = parsed.positionals[0];
    if (!json) {
      throw new ValidationError("Missing required JSON property dictionary.");
    }
    if (parsed.positionals.length > 1) {
      throw new ValidationError("create:record accepts only one JSON argument.");
    }

    const properties = parseJsonObject(json, "record properties");
    const inRef = buildGroupRef(parsed, "db", "at");
    const parameters: Record<string, PropertyValue> = {};
    if (inRef) parameters.in = inRef;

    return {
      commandName: "create record with",
      directValue: properties,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
