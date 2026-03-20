import type { DevonthinkCommandInput } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  parseArgs
} from "../utils/args.js";
import { buildGroupRef, buildRecordRefFromUuidOrPath } from "../utils/locators.js";
import { ensureNoPositionals, renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class RecordDuplicateCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "duplicate";
  readonly category = "Core";
  readonly description = "Duplicate a record to another group.";

  help(): string {
    return [
      "Usage:",
      "  dt duplicate --uuid <uuid> --to-db <name|uuid> --to <path>",
      "  dt duplicate --db <name|uuid> --at <path> --to-db <name|uuid> --to <path>",
      "",
      "Duplicate a record to a destination group.",
      "",
      "Options:",
      "  --uuid <uuid>         Record to duplicate (by UUID)",
      "  --db <name|uuid>      Source database (for path-based lookup)",
      "  --at <path>           Record location path",
      "  --to-db <name|uuid>   Destination database",
      "  --to <path>           Destination group path",
      "",
      "Examples:",
      '  dt duplicate --uuid "ABC-123" --to-db "01. Personal" --to "/Projects/Archive"',
      '  dt duplicate --db "01. Personal" --at "/Inbox/Report.pdf" --to-db "01. Personal" --to "/Archive"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["uuid", "db", "at", "to-db", "to"]);
    assertNoMissingOptionValues(parsed, ["uuid", "db", "at", "to-db", "to"]);
    ensureNoPositionals(parsed, "duplicate");

    const record = buildRecordRefFromUuidOrPath(parsed, { required: true, label: "duplicate" })!;
    const to = buildGroupRef(parsed, "to-db", "to", { required: true, requireAt: true })!;

    return {
      commandName: "duplicate",
      parameters: { record, to }
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
