import {
  ValidationError
} from "../application/errors.js";
import type {
  DevonthinkSchema,
  JsonValue,
  SchemaObjectKind,
  SchemaProperty
} from "../application/types.js";
import {
  getOption,
  hasBoolean,
  type ParsedArgs
} from "../utils/args.js";
import {
  parseAssignment
} from "../utils/values.js";

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
