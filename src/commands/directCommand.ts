import { parseArgs } from "../utils/args.js";
import { parseSchemaCommandInput, renderJson, schemaCommandHelp } from "./helpers.js";
import type { CommandContext, CommandModule } from "./types.js";
import type { PropertyValue, SchemaCommand } from "../application/types.js";

interface DirectCommandInput {
  commandName: string;
  directValue?: PropertyValue;
  parameters?: Record<string, PropertyValue>;
}

export class DirectCommand implements CommandModule<DirectCommandInput> {
  readonly name: string;
  readonly description: string;

  constructor(private readonly schemaCommand: SchemaCommand) {
    this.name = schemaCommand.cliName;
    this.description = schemaCommand.description;
  }

  help(context?: CommandContext): string {
    if (!context) {
      return `Usage: dt ${this.name} [options]`;
    }

    return schemaCommandHelp(context.schema, this.schemaCommand);
  }

  parse(argv: string[], context?: CommandContext): DirectCommandInput {
    const parsed = parseArgs(argv);
    if (!context) {
      throw new Error("Direct commands require command context during parsing.");
    }
    return parseSchemaCommandInput(parsed, context.schema, this.schemaCommand);
  }

  async execute(input: DirectCommandInput, context: CommandContext): Promise<void> {
    const result = await context.devonthink.invokeCommand(input);
    context.output.write(renderJson(result));
  }
}
