import { JxaDevonthinkAdapter } from "./adapters/jxa/JxaDevonthinkAdapter.js";
import { ConsoleOutputAdapter } from "./adapters/output/ConsoleOutputAdapter.js";
import { devonthinkSchema } from "./schema/index.js";
import { ApplicationCommand } from "./commands/applicationCommand.js";
import { CommandRegistry } from "./commands/CommandRegistry.js";
import { DatabaseCommand } from "./commands/databaseCommand.js";
import { DirectCommand } from "./commands/directCommand.js";
import { GroupCommand } from "./commands/groupCommand.js";
import { RecordCommand } from "./commands/recordCommand.js";
import { NodeProcessRunner } from "./infrastructure/processRunner.js";

export function createRuntime() {
  const schema = devonthinkSchema;
  const output = new ConsoleOutputAdapter();
  const devonthink = new JxaDevonthinkAdapter(new NodeProcessRunner(), schema);
  const registry = new CommandRegistry();

  registry.register(new ApplicationCommand());
  registry.register(new DatabaseCommand());
  registry.register(new GroupCommand());
  registry.register(new RecordCommand());

  for (const command of Object.values(schema.commands)) {
    registry.register(new DirectCommand(command));
  }

  return {
    output,
    devonthink,
    registry,
    schema
  };
}
