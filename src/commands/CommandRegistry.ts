import { ValidationError } from "../application/errors.js";
import type { CommandContext, CommandModule } from "./types.js";

export class CommandRegistry {
  private readonly commands = new Map<string, CommandModule>();

  register(command: CommandModule): void {
    this.commands.set(command.name, command);
  }

  help(): string {
    const lines = ["Usage: dt <command> [options]", "", "Commands:"];

    for (const command of [...this.commands.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      lines.push(`  ${command.name.padEnd(24)} ${command.description}`);
    }

    return lines.join("\n");
  }

  async run(argv: string[], context: CommandContext): Promise<void> {
    const [commandName, ...rest] = argv;

    if (!commandName || commandName === "help" || commandName === "--help") {
      context.output.write(this.help());
      return;
    }

    const command = this.commands.get(commandName);

    if (!command) {
      throw new ValidationError(`Unknown command: ${commandName}`);
    }

    if (rest.includes("--help")) {
      context.output.write(command.help(context));
      return;
    }

    const input = command.parse(rest, context);
    await command.execute(input, context);
  }
}
