import { ValidationError } from "../application/errors.js";
import { assertNoUnknownOptions, parseArgs } from "../utils/args.js";
import { renderJson, validateProperties } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";

interface ApplicationInput {
  action: "get";
  properties: string[];
}

export class ApplicationCommand implements CommandModule<ApplicationInput> {
  readonly name = "application";
  readonly description = "Get application properties.";

  help(): string {
    return [
      "Usage: dt application get [--property <name> ...]",
      "",
      "Examples:",
      '  dt application get --property "inbox" --property "incoming group"'
    ].join("\n");
  }

  parse(argv: string[], context?: CommandContext): ApplicationInput {
    const parsed = parseArgs(argv);
    const [action, ...rest] = parsed.positionals;

    if (action !== "get") {
      throw new ValidationError("application supports only the 'get' subcommand.");
    }

    if (rest.length > 0) {
      throw new ValidationError("application get does not accept positional arguments.");
    }

    assertNoUnknownOptions(parsed, ["property"]);

    const properties = context
      ? validateProperties(context.schema, "application", parsed.options.get("property") ?? [])
      : parsed.options.get("property") ?? [];

    return {
      action,
      properties
    };
  }

  async execute(input: ApplicationInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.getApplication({
      properties: input.properties
    });
    context.output.write(renderJson(result));
  }
}
