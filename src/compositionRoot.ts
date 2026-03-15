import { JxaDevonthinkAdapter } from "./adapters/jxa/JxaDevonthinkAdapter.js";
import { ConsoleOutputAdapter } from "./adapters/output/ConsoleOutputAdapter.js";
import { devonthinkSchema } from "./schema/index.js";
import { CommandRegistry } from "./commands/CommandRegistry.js";
import { NodeProcessRunner } from "./infrastructure/processRunner.js";
import { AddCommand } from "./commands/addCommand.js";
import { DeleteCommand } from "./commands/deleteCommand.js";
import { MoveCommand } from "./commands/moveCommand.js";
import { ListCommand } from "./commands/listCommand.js";
import { SearchCommand } from "./commands/searchCommand.js";
import { IndexCommand } from "./commands/indexCommand.js";
import { PropertyGetCommand } from "./commands/propertyGetCommand.js";
import { PropertySetCommand } from "./commands/propertySetCommand.js";
import { CreateLocationCommand } from "./commands/createLocationCommand.js";
import { CreateRecordCommand } from "./commands/createRecordCommand.js";
import { LookupFileCommand } from "./commands/lookupFileCommand.js";
import { LookupTagsCommand } from "./commands/lookupTagsCommand.js";
import { LookupUrlCommand } from "./commands/lookupUrlCommand.js";
import { LookupPathCommand } from "./commands/lookupPathCommand.js";
import { AiClassifyCommand } from "./commands/aiClassifyCommand.js";
import { AiCompareCommand } from "./commands/aiCompareCommand.js";
import { RecordGetCommand } from "./commands/recordGetCommand.js";
import { RecordDuplicateCommand } from "./commands/recordDuplicateCommand.js";
import { RecordReplicateCommand } from "./commands/recordReplicateCommand.js";

export function createRuntime() {
  const schema = devonthinkSchema;
  const output = new ConsoleOutputAdapter();
  const devonthink = new JxaDevonthinkAdapter(new NodeProcessRunner(), schema);
  const registry = new CommandRegistry();

  registry.register(new AddCommand());
  registry.register(new DeleteCommand());
  registry.register(new MoveCommand());
  registry.register(new ListCommand());
  registry.register(new SearchCommand());
  registry.register(new PropertyGetCommand());
  registry.register(new PropertySetCommand());
  registry.register(new CreateLocationCommand());
  registry.register(new CreateRecordCommand());
  registry.register(new LookupFileCommand());
  registry.register(new LookupTagsCommand());
  registry.register(new LookupUrlCommand());
  registry.register(new LookupPathCommand());
  registry.register(new AiClassifyCommand());
  registry.register(new AiCompareCommand());
  registry.register(new RecordGetCommand());
  registry.register(new RecordDuplicateCommand());
  registry.register(new RecordReplicateCommand());
  registry.register(new IndexCommand());

  return {
    output,
    devonthink,
    registry,
    schema
  };
}
