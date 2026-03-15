import type { DevonthinkPort, OutputPort } from "../application/ports.js";
import type { DevonthinkSchema } from "../application/types.js";

export interface CommandContext {
  output: OutputPort;
  devonthink: DevonthinkPort;
  schema: DevonthinkSchema;
}

export interface CommandModule<TInput = unknown> {
  name: string;
  description: string;
  help(context?: CommandContext): string;
  parse(argv: string[], context?: CommandContext): TInput;
  execute(input: TInput, context: CommandContext): Promise<void>;
}
