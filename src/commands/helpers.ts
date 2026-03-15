import {
  ExternalToolError,
  ValidationError
} from "../application/errors.js";
import type {
  PropertyValue,
  DevonthinkSchema,
  JsonValue,
  SchemaCommand,
  SchemaObjectKind,
  SchemaParameter,
  SchemaProperty
} from "../application/types.js";
import {
  assertNoUnknownOptions,
  getOption,
  getOptions,
  hasBoolean,
  type ParsedArgs
} from "../utils/args.js";
import {
  readContainerReference,
  readRecordReference
} from "../utils/locators.js";
import {
  coerceCliValue,
  parseAssignment,
  parseJsonObject
} from "../utils/values.js";

const LOCATOR_TYPES = new Set(["database", "parent", "record", "content"]);
const PRIMITIVE_TYPES = new Set([
  "array",
  "boolean",
  "comparison type",
  "data type",
  "dictionary",
  "integer",
  "missing value",
  "real",
  "search comparison",
  "tag type",
  "text"
]);

export function renderJson(value: JsonValue): string {
  return JSON.stringify(value, null, 2);
}

export function ensureNoPositionals(parsed: ParsedArgs, label: string): void {
  if (parsed.positionals.length > 0) {
    throw new ValidationError(`${label} does not accept positional arguments.`);
  }
}

export function validateProperties(
  schema: DevonthinkSchema,
  kind: SchemaObjectKind,
  names: string[]
): string[] {
  return names.map((name) => lookupProperty(schema, kind, name).name);
}

export function parseSetExpressions(
  schema: DevonthinkSchema,
  kind: SchemaObjectKind,
  assignments: string[]
): Record<string, JsonValue> {
  if (assignments.length === 0) {
    throw new ValidationError("At least one --set assignment is required.");
  }

  const values: Record<string, JsonValue> = {};

  for (const entry of assignments) {
    const preliminary = parseAssignment(entry);
    const property = lookupProperty(schema, kind, preliminary.name);
    if (!property.writable) {
      throw new ValidationError(`Property is read-only: ${property.name}`);
    }

    const parsed = parseAssignment(entry, property);
    values[property.name] = parsed.value;
  }

  return values;
}

export function lookupProperty(
  schema: DevonthinkSchema,
  kind: SchemaObjectKind,
  name: string
): SchemaProperty {
  const needle = name.trim().toLowerCase();
  const property = schema.objects[kind].properties.find(
    (candidate) =>
      candidate.name.toLowerCase() === needle || candidate.key.toLowerCase() === needle
  );

  if (!property) {
    throw new ValidationError(`Unknown ${kind} property: ${name}`);
  }

  return property;
}

export function assertAllowedOptions(parsed: ParsedArgs, allowed: Iterable<string>): void {
  assertNoUnknownOptions(parsed, [...allowed]);
}

export function schemaCommandHelp(
  schema: DevonthinkSchema,
  command: SchemaCommand
): string {
  const lines = [
    `Usage: dt ${command.cliName}${command.directParameter ? " [value]" : ""} [options]`,
    "",
    command.description
  ];

  if (command.directParameter) {
    lines.push("");
    lines.push(`Direct parameter: ${command.directParameter.description}`);
  }

  if (command.parameters.length > 0) {
    lines.push("");
    lines.push("Options:");

    for (const parameter of command.parameters) {
      const optionLines = schemaParameterHelp(schema, parameter);
      lines.push(...optionLines);
    }
  }

  return lines.join("\n");
}

export function schemaAllowedOptions(command: SchemaCommand): string[] {
  const allowed = new Set<string>();

  if (command.directParameter) {
    allowed.add("value");
  }

  for (const parameter of command.parameters) {
    const kinds = new Set(parameter.types.map((typeRef) => typeRef.name));
    if (kinds.has("database") || kinds.has("parent")) {
      allowed.add(`${parameter.optionName}-database`);
      allowed.add(`${parameter.optionName}-at`);
      continue;
    }

    if (kinds.has("record") || kinds.has("content")) {
      allowed.add(`${parameter.optionName}-uuid`);
      allowed.add(`${parameter.optionName}-database`);
      allowed.add(`${parameter.optionName}-at`);
      continue;
    }

    allowed.add(parameter.optionName);
  }

  return [...allowed];
}

export function parseSchemaCommandInput(
  parsed: ParsedArgs,
  schema: DevonthinkSchema,
  command: SchemaCommand
): {
  commandName: string;
  directValue?: PropertyValue;
  parameters?: Record<string, PropertyValue>;
} {
  assertAllowedOptions(parsed, schemaAllowedOptions(command));

  const directValue = parseDirectValue(parsed, command.directParameter);
  const parameters: Record<string, PropertyValue> = {};

  for (const parameter of command.parameters) {
    const value = parseSchemaParameter(parsed, schema, parameter);
    if (value !== undefined) {
      parameters[parameter.key] = value;
      continue;
    }

    if (!parameter.optional) {
      throw new ValidationError(`Missing required argument for ${command.cliName}: ${parameter.name}.`);
    }
  }

  return {
    commandName: command.name,
    directValue,
    parameters: Object.keys(parameters).length > 0 ? parameters : undefined
  };
}

export function parseBooleanOption(parsed: ParsedArgs, name: string): boolean | undefined {
  if (hasBoolean(parsed, name)) {
    return true;
  }

  const value = getOption(parsed, name);
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new ValidationError(`Option --${name} must be true or false.`);
}

export function commandResultError(commandName: string, error: unknown): never {
  throw new ExternalToolError(
    `${commandName} failed: ${error instanceof Error ? error.message : String(error)}`
  );
}

function schemaParameterHelp(
  schema: DevonthinkSchema,
  parameter: SchemaParameter
): string[] {
  const kinds = new Set(parameter.types.map((typeRef) => typeRef.name));

  if (kinds.has("database") || kinds.has("parent")) {
    return [
      `  --${parameter.optionName}-database <name|uuid>  ${parameter.description}`,
      `  --${parameter.optionName}-at <path>             DEVONthink location path`
    ];
  }

  if (kinds.has("record") || kinds.has("content")) {
    return [
      `  --${parameter.optionName}-uuid <uuid>           ${parameter.description}`,
      `  --${parameter.optionName}-database <name|uuid>  Record database when locating by path`,
      `  --${parameter.optionName}-at <path>             Record path when locating by path`
    ];
  }

  const enumValues = findEnumValues(schema, parameter);
  const suffix = enumValues ? ` Values: ${enumValues.join(", ")}` : "";
  return [`  --${parameter.optionName} <value>  ${parameter.description}${suffix}`];
}

function parseDirectValue(
  parsed: ParsedArgs,
  parameter: SchemaParameter | null
): JsonValue | JsonValue[] | Record<string, JsonValue> | undefined {
  if (!parameter) {
    ensureNoPositionals(parsed, "This command");
    return undefined;
  }

  const values = [...parsed.positionals, ...getOptions(parsed, "value")];
  if (values.length === 0) {
    if (parameter.optional) {
      return undefined;
    }

    throw new ValidationError("Missing required direct parameter.");
  }

  const list = parameter.types.some((typeRef) => typeRef.list);
  if (!list && values.length > 1) {
    throw new ValidationError("This command accepts only one direct value.");
  }

  if (list) {
    return values.map((value) => coerceParameterValue(value, parameter));
  }

  return coerceParameterValue(requireFirstValue(values), parameter);
}

function parseSchemaParameter(
  parsed: ParsedArgs,
  schema: DevonthinkSchema,
  parameter: SchemaParameter
): PropertyValue | undefined {
  const kinds = new Set(parameter.types.map((typeRef) => typeRef.name));

  if (kinds.has("database") || kinds.has("parent")) {
    return readContainerReference(parsed, parameter.optionName, {
      required: !parameter.optional,
      allowDatabaseOnly: kinds.has("database")
    });
  }

  if (kinds.has("record") || kinds.has("content")) {
    const allowMany = parameter.types.some((typeRef) => typeRef.list);
    return readRecordReference(parsed, parameter.optionName, {
      required: !parameter.optional,
      allowMany
    });
  }

  if (kinds.has("boolean")) {
    return parseBooleanOption(parsed, parameter.optionName);
  }

  const rawValues = getOptions(parsed, parameter.optionName);
  if (rawValues.length === 0) {
    return undefined;
  }

  const list = parameter.types.some((typeRef) => typeRef.list);
  if (!list && rawValues.length > 1) {
    throw new ValidationError(`Option --${parameter.optionName} can only be provided once.`);
  }

  const enumValues = findEnumValues(schema, parameter);
  if (enumValues) {
    return list
      ? rawValues.map((value) => normalizeEnumValue(enumValues, value, parameter.optionName))
      : normalizeEnumValue(enumValues, requireFirstValue(rawValues), parameter.optionName);
  }

  if (kinds.has("dictionary")) {
    return list
      ? rawValues.map((value) => parseJsonObject(value, `--${parameter.optionName}`))
      : parseJsonObject(requireFirstValue(rawValues), `--${parameter.optionName}`);
  }

  return list
    ? rawValues.map((value) => coerceParameterValue(value, parameter))
    : coerceParameterValue(requireFirstValue(rawValues), parameter);
}

function findEnumValues(
  schema: DevonthinkSchema,
  parameter: SchemaParameter
): string[] | undefined {
  const enumType = parameter.types.find(
    (typeRef) => !LOCATOR_TYPES.has(typeRef.name) && !PRIMITIVE_TYPES.has(typeRef.name)
  );

  if (!enumType) {
    return undefined;
  }

  return schema.enums[enumType.name];
}

function normalizeEnumValue(values: string[], raw: string, optionName: string): string {
  const needle = raw.trim().toLowerCase();
  const match = values.find((value) => value.toLowerCase() === needle);

  if (!match) {
    throw new ValidationError(
      `Invalid value for --${optionName}. Expected one of: ${values.join(", ")}.`
    );
  }

  return match;
}

function coerceParameterValue(value: string, parameter: SchemaParameter): JsonValue {
  const kinds = new Set(parameter.types.map((typeRef) => typeRef.name));

  if (kinds.has("dictionary")) {
    return parseJsonObject(value, parameter.name);
  }

  return coerceCliValue(value);
}

function requireFirstValue(values: string[]): string {
  const first = values[0];
  if (first === undefined) {
    throw new ValidationError("Expected at least one value.");
  }
  return first;
}
