import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  parseArgs
} from "../utils/args.js";
import { buildGroupRef, buildRecordRef } from "../utils/locators.js";
import { ensureNoPositionals, renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class MoveCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "move";
  readonly category = "Core";
  readonly description = "Move a record to a different group.";

  help(): string {
    return [
      "Usage: dt move --uuid <uuid> --to-db <name|uuid> --to <path> [--from-db <name|uuid> --from <path>]",
      "",
      "Move all instances of a record to a different group.",
      "Specify --from-db/--from to move a single instance.",
      "",
      "Options:",
      "  --uuid <uuid>         Record to move",
      "  --to-db <name|uuid>   Destination database",
      "  --to <path>           Destination group path",
      "  --from-db <name|uuid> Source database (optional)",
      "  --from <path>         Source group path (optional)",
      "",
      "Examples:",
      '  dt move --uuid "ABC-123" --to-db "01. Personal" --to "/Projects/Archive"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["uuid", "to-db", "to", "from-db", "from"]);
    assertNoMissingOptionValues(parsed, ["uuid", "to-db", "to", "from-db", "from"]);
    ensureNoPositionals(parsed, "move");

    const record = buildRecordRef(parsed, "uuid", { required: true })!;
    const to = buildGroupRef(parsed, "to-db", "to", { required: true, requireAt: true })!;
    const from = buildGroupRef(parsed, "from-db", "from", { requireAt: true });
    const parameters: Record<string, PropertyValue> = { record, to };
    if (from) parameters.from = from;

    return {
      commandName: "move",
      parameters
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
