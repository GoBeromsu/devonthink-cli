import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  parseArgs
} from "../utils/args.js";
import { buildGroupRef, buildRecordRefFromUuidOrPath } from "../utils/locators.js";
import { ensureNoPositionals, renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class MoveCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "move";
  readonly category = "Core";
  readonly description = "Move a record to a different group.";

  help(): string {
    return [
      "Usage:",
      "  dt move --uuid <uuid> --to-db <name|uuid> --to <path>",
      "  dt move --db <name|uuid> --at <path> --to-db <name|uuid> --to <path>",
      "",
      "Move all instances of a record to a different group.",
      "Specify --from-db/--from to move a single instance.",
      "",
      "Options:",
      "  --uuid <uuid>         Record to move (by UUID)",
      "  --db <name|uuid>      Source database (for path-based lookup)",
      "  --at <path>           Record location path",
      "  --to-db <name|uuid>   Destination database",
      "  --to <path>           Destination group path",
      "  --from-db <name|uuid> Source group database (optional, for replicated records)",
      "  --from <path>         Source group path (optional)",
      "",
      "Examples:",
      '  dt move --uuid "ABC-123" --to-db "01. Personal" --to "/Projects/Archive"',
      '  dt move --db "01. Personal" --at "/Inbox/Report.pdf" --to-db "01. Personal" --to "/Projects"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["uuid", "db", "at", "to-db", "to", "from-db", "from"]);
    assertNoMissingOptionValues(parsed, ["uuid", "db", "at", "to-db", "to", "from-db", "from"]);
    ensureNoPositionals(parsed, "move");

    const record = buildRecordRefFromUuidOrPath(parsed, { required: true, label: "move" })!;
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
