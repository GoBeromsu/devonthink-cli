export type JsonPrimitive = boolean | number | string | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface DatabaseSelector {
  name?: string;
  uuid?: string;
  identifier?: string;
}

export interface GroupSelector {
  database: DatabaseSelector;
  at?: string;
}

export interface RecordSelector {
  uuid?: string;
  database?: DatabaseSelector;
  at?: string;
}

export interface DatabaseReference {
  $type: "database";
  locator: DatabaseSelector;
}

export interface GroupReference {
  $type: "group";
  locator: GroupSelector;
}

export interface ContainerReference {
  $type: "container";
  locator: GroupSelector;
}

export interface RecordReference {
  $type: "record";
  locator: RecordSelector;
}

export type PropertyValue =
  | JsonValue
  | DatabaseReference
  | GroupReference
  | ContainerReference
  | RecordReference
  | PropertyValue[];

export interface DevonthinkCommandInput {
  commandName: string;
  directValue?: PropertyValue;
  parameters?: Record<string, PropertyValue>;
}

export interface SchemaTypeRef {
  name: string;
  list: boolean;
}

export interface SchemaParameter {
  name: string;
  key: string;
  optionName: string;
  optional: boolean;
  description: string;
  types: SchemaTypeRef[];
}

export interface SchemaCommand {
  name: string;
  cliName: string;
  methodName: string;
  description: string;
  directParameter: SchemaParameter | null;
  parameters: SchemaParameter[];
  result: SchemaTypeRef[];
}

export interface SchemaProperty {
  name: string;
  key: string;
  access: string;
  writable: boolean;
  type: string;
  description: string;
  inProperties: boolean;
}

export interface SchemaObject {
  scriptClass: string;
  properties: SchemaProperty[];
}

export type SchemaObjectKind = "application" | "database" | "group" | "record";

export interface DevonthinkSchema {
  generatedAt: string;
  sourceAppPath: string;
  commands: Record<string, SchemaCommand>;
  objects: Record<SchemaObjectKind, SchemaObject>;
  enums: Record<string, string[]>;
}
