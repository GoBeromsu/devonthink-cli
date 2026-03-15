import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import { assertNoUnknownOptions, parseArgs } from "../utils/args.js";
import { buildContainerRef, buildRecordRef } from "../utils/locators.js";
import { ensureNoPositionals, renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class AiClassifyCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "ai:classify";
  readonly category = "AI";
  readonly description = "Classify a record into suggested groups.";

  help(): string {
    return [
      "Usage: dt ai:classify --uuid <uuid> [--db <name|uuid>]",
      "",
      "Get a list of groups where DEVONthink suggests the record belongs.",
      "",
      "Options:",
      "  --uuid <uuid>      Record to classify",
      "  --db <name|uuid>   Limit classification to a specific database",
      "",
      "Examples:",
      '  dt ai:classify --uuid "ABC-123"',
      '  dt ai:classify --uuid "ABC-123" --db "01. Personal"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["uuid", "db"]);
    ensureNoPositionals(parsed, "ai:classify");

    const record = buildRecordRef(parsed, "uuid", { required: true })!;
    const inRef = buildContainerRef(parsed, "db");
    const parameters: Record<string, PropertyValue> = { record };
    if (inRef) parameters.in = inRef;

    return {
      commandName: "classify",
      parameters
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
