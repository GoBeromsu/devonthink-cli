import { ValidationError } from "../application/errors.js";
import type { DevonthinkCommandInput, PropertyValue } from "../application/types.js";
import {
  assertNoMissingOptionValues,
  assertNoUnknownOptions,
  getOption,
  parseArgs
} from "../utils/args.js";
import { buildRecordRef } from "../utils/locators.js";
import { ensureNoPositionals, renderJson } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

export class AiCompareCommand implements CommandModule<DevonthinkCommandInput> {
  readonly name = "ai:compare";
  readonly category = "AI";
  readonly description = "Find similar records by comparison.";

  help(): string {
    return [
      "Usage: dt ai:compare (--uuid <uuid> | --content <text>)",
      "",
      "Get a list of similar records, either by specifying a record or content text.",
      "",
      "Options:",
      "  --uuid <uuid>      Record to compare",
      '  --content <text>   Text content to compare against',
      "",
      "Examples:",
      '  dt ai:compare --uuid "ABC-123"',
      '  dt ai:compare --content "machine learning paper on transformers"'
    ].join("\n");
  }

  parse(argv: string[]): DevonthinkCommandInput {
    const parsed = parseArgs(argv);
    assertNoUnknownOptions(parsed, ["uuid", "content"]);
    assertNoMissingOptionValues(parsed, ["uuid", "content"]);
    ensureNoPositionals(parsed, "ai:compare");

    const record = buildRecordRef(parsed, "uuid");
    const content = getOption(parsed, "content");

    if (!record && !content) {
      throw new ValidationError("ai:compare requires --uuid or --content.");
    }

    const parameters: Record<string, PropertyValue> = {};
    if (record) parameters.record = record;
    if (content) parameters.content = content;

    return {
      commandName: "compare",
      parameters
    };
  }

  async execute(input: DevonthinkCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
