import { ValidationError } from "../application/errors.js";
import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import { assertNoUnknownOptions, getOption, parseArgs } from "../utils/args.js";
import { buildContainerRef } from "../utils/locators.js";
import { ensureNoPositionals, renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class RecordGetCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "record:get";
  readonly category = "Record";
  readonly description = "Get a record by UUID or path.";

  help(): string {
    return [
      "Usage:",
      "  dt record:get --uuid <uuid>",
      "  dt record:get --db <name|uuid> --at <path>",
      "",
      "Retrieve a record object by UUID or by its location in a database.",
      "",
      "Options:",
      "  --uuid <uuid>        Record UUID or item link",
      "  --db <name|uuid>     Database (for path-based lookup)",
      "  --at <path>          Record location path",
      "",
      "Examples:",
      '  dt record:get --uuid "ABC-123"',
      '  dt record:get --db "01. Personal" --at "/Projects/Report.pdf"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["uuid", "db", "at"]);
    ensureNoPositionals(parsed, "record:get");

    const uuid = getOption(parsed, "uuid");
    const db = getOption(parsed, "db");
    const at = getOption(parsed, "at");

    if (uuid) {
      return {
        commandName: "get record with uuid",
        directValue: uuid
      };
    }

    if (db && at) {
      const inRef = buildContainerRef(parsed, "db");
      const parameters: Record<string, PropertyValue> = {};
      if (inRef) parameters.in = inRef;

      return {
        commandName: "get record at",
        directValue: at,
        parameters: Object.keys(parameters).length > 0 ? parameters : undefined
      };
    }

    if (db) {
      throw new ValidationError("record:get with --db requires --at.");
    }

    throw new ValidationError("record:get requires --uuid or --db with --at.");
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
