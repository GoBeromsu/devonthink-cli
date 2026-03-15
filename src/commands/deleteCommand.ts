import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import { assertNoUnknownOptions, parseArgs } from "../utils/args.js";
import { buildGroupRef, buildRecordRef } from "../utils/locators.js";
import { ensureNoPositionals, renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class DeleteCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "delete";
  readonly category = "Core";
  readonly description = "Delete a record from DEVONthink.";

  help(): string {
    return [
      "Usage: dt delete --uuid <uuid> [--from-db <name|uuid> --from <path>]",
      "",
      "Delete all instances of a record, or one instance from a specified group.",
      "",
      "Options:",
      "  --uuid <uuid>        Record to delete",
      "  --from-db <name|uuid> Source database (for single-instance delete)",
      "  --from <path>        Source group path",
      "",
      "Examples:",
      '  dt delete --uuid "ABC-123"',
      '  dt delete --uuid "ABC-123" --from-db "01. Personal" --from "/Projects"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["uuid", "from-db", "from"]);
    ensureNoPositionals(parsed, "delete");

    const record = buildRecordRef(parsed, "uuid", { required: true })!;
    const from = buildGroupRef(parsed, "from-db", "from");
    const parameters: Record<string, PropertyValue> = { record };
    if (from) parameters.in = from;

    return {
      commandName: "delete",
      parameters
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
