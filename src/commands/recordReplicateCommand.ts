import type { DevonthinkCommandInput } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  parseArgs
} from "../utils/args.js";
import { buildGroupRef, buildRecordRefFromUuidOrPath } from "../utils/locators.js";
import { ensureNoPositionals, renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class RecordReplicateCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "replicate";
  readonly category = "Core";
  readonly description = "Replicate a record to another group.";

  help(): string {
    return [
      "Usage:",
      "  dt replicate --uuid <uuid> --to-db <name|uuid> --to <path>",
      "  dt replicate --db <name|uuid> --at <path> --to-db <name|uuid> --to <path>",
      "",
      "Replicate a record to a destination group (must be in the same database).",
      "",
      "Options:",
      "  --uuid <uuid>         Record to replicate (by UUID)",
      "  --db <name|uuid>      Source database (for path-based lookup)",
      "  --at <path>           Record location path",
      "  --to-db <name|uuid>   Destination database",
      "  --to <path>           Destination group path",
      "",
      "Examples:",
      '  dt replicate --uuid "ABC-123" --to-db "01. Personal" --to "/Projects/Archive"',
      '  dt replicate --db "01. Personal" --at "/Inbox/Report.pdf" --to-db "01. Personal" --to "/Archive"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["uuid", "db", "at", "to-db", "to"]);
    assertNoMissingOptionValues(parsed, ["uuid", "db", "at", "to-db", "to"]);
    ensureNoPositionals(parsed, "replicate");

    const record = buildRecordRefFromUuidOrPath(parsed, { required: true, label: "replicate" })!;
    const to = buildGroupRef(parsed, "to-db", "to", { required: true, requireAt: true })!;

    return {
      commandName: "replicate",
      parameters: { record, to }
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
