import type {
  DatabaseSelector,
  DevonthinkCommandInput,
  GroupSelector,
  JsonValue,
  PropertyValue,
  RecordSelector
} from "./types.js";

export interface OutputPort {
  write(message: string): void;
  writeError(message: string): void;
}

export interface PropertyReadInput {
  properties?: string[];
}

export interface DatabaseGetInput extends PropertyReadInput {
  locator: DatabaseSelector;
}

export interface DatabaseSetInput extends DatabaseGetInput {
  values: Record<string, PropertyValue>;
}

export interface GroupListInput extends PropertyReadInput {
  locator: GroupSelector;
}

export interface GroupGetInput extends PropertyReadInput {
  locator: GroupSelector;
}

export interface GroupSetInput extends GroupGetInput {
  values: Record<string, PropertyValue>;
}

export interface RecordGetInput extends PropertyReadInput {
  locator: RecordSelector;
}

export interface RecordSetInput extends RecordGetInput {
  values: Record<string, PropertyValue>;
}

export interface DevonthinkPort {
  getApplication(input: PropertyReadInput): Promise<JsonValue>;
  listDatabases(input: PropertyReadInput): Promise<JsonValue[]>;
  getDatabase(input: DatabaseGetInput): Promise<JsonValue>;
  setDatabase(input: DatabaseSetInput): Promise<JsonValue>;
  listGroups(input: GroupListInput): Promise<JsonValue[]>;
  getGroup(input: GroupGetInput): Promise<JsonValue>;
  setGroup(input: GroupSetInput): Promise<JsonValue>;
  getRecord(input: RecordGetInput): Promise<JsonValue>;
  setRecord(input: RecordSetInput): Promise<JsonValue>;
  invokeCommand(input: DevonthinkCommandInput): Promise<JsonValue>;
}
