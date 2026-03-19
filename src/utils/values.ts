import { ValidationError } from "../application/errors.js";
import type { JsonValue, SchemaProperty } from "../application/types.js";

export function coerceCliValue(raw: string): JsonValue {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return "";
  }

  if (
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null" ||
    /^-?\d+(?:\.\d+)?$/u.test(trimmed) ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[") ||
    trimmed.startsWith("\"")
  ) {
    try {
      return JSON.parse(trimmed) as JsonValue;
    } catch (_error) {
      return raw;
    }
  }

  return raw;
}

export function parseJsonObject(raw: string, label: string): Record<string, JsonValue> {
  const value = coerceCliValue(raw);

  if (!isPlainObject(value)) {
    throw new ValidationError(`${label} must be a JSON object.`);
  }

  return value;
}

export function parseAssignment(
  raw: string,
  property?: SchemaProperty
): { name: string; value: JsonValue } {
  const separatorIndex = raw.indexOf("=");

  if (separatorIndex < 1) {
    throw new ValidationError(`Invalid assignment: ${raw}`);
  }

  const name = raw.slice(0, separatorIndex).trim();
  const valueRaw = raw.slice(separatorIndex + 1);

  if (!name) {
    throw new ValidationError(`Invalid assignment: ${raw}`);
  }

  return {
    name,
    value: coerceAssignmentValue(valueRaw, property)
  };
}

function coerceAssignmentValue(raw: string, property?: SchemaProperty): JsonValue {
  if (
    property?.type === "array" &&
    !raw.trim().startsWith("[") &&
    raw.includes(",")
  ) {
    return raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (property && isStringLikeProperty(property)) {
    return raw;
  }

  return coerceCliValue(raw);
}

function isStringLikeProperty(property: SchemaProperty): boolean {
  return property.type === "text" || property.type === "content" || property.type === "rich text";
}

function isPlainObject(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
