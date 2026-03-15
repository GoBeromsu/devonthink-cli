import { ValidationError } from "../application/errors.js";

export function escapeDevonthinkName(name: string): string {
  return name.replaceAll("/", "\\/");
}

export function unescapeDevonthinkName(name: string): string {
  return name.replaceAll("\\/", "/");
}

export function normalizeDevonthinkPath(path: string): string {
  const trimmed = path.trim();

  if (!trimmed) {
    throw new ValidationError("DEVONthink path cannot be empty.");
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  if (withLeadingSlash === "/") {
    return "/";
  }

  let normalized = "";
  let previous = "";
  for (const character of withLeadingSlash) {
    if (character === "/" && previous !== "\\" && normalized.endsWith("/")) {
      previous = character;
      continue;
    }

    normalized += character;
    previous = character;
  }

  if (normalized.endsWith("/") && normalized !== "/") {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

export function splitDevonthinkPath(path: string): string[] {
  const normalized = normalizeDevonthinkPath(path);

  if (normalized === "/") {
    return [];
  }

  const segments: string[] = [];
  let current = "";
  let escaping = false;

  for (const character of normalized.slice(1)) {
    if (escaping) {
      current += character;
      escaping = false;
      continue;
    }

    if (character === "\\") {
      escaping = true;
      continue;
    }

    if (character === "/") {
      segments.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  if (escaping) {
    current += "\\";
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

export function joinDevonthinkPath(parentPath: string, name: string): string {
  const normalizedParent = normalizeDevonthinkPath(parentPath);
  const escapedName = escapeDevonthinkName(name);

  if (normalizedParent === "/") {
    return `/${escapedName}`;
  }

  return `${normalizedParent}/${escapedName}`;
}

export function getBaseName(path: string): string {
  const segments = splitDevonthinkPath(path);
  return unescapeDevonthinkName(segments.at(-1) ?? "");
}

export function getParentDevonthinkPath(path: string): string {
  const segments = splitDevonthinkPath(path);

  if (segments.length <= 1) {
    return "/";
  }

  return `/${segments.slice(0, -1).join("/")}`;
}
