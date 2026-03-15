import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_PATH = "/Applications/DEVONthink.app";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "../src/schema/devonthink-schema.json");

const COMMAND_NAMES = [
  "search",
  "import path",
  "index path",
  "create location",
  "create record with",
  "get record at",
  "get record with uuid",
  "lookup records with file",
  "lookup records with path",
  "lookup records with tags",
  "lookup records with URL",
  "move",
  "delete",
  "duplicate",
  "replicate",
  "compare",
  "classify"
];

const CLASS_NAMES = ["application", "database", "parent", "record"];
const ENUM_NAMES = [
  "comparison type",
  "search comparison",
  "data type",
  "tag type"
];

const rawXml = execFileSync("sdef", [APP_PATH], { encoding: "utf8" });
const xml = rawXml.replace(/<!--[\s\S]*?-->/gu, "");

const schema = {
  generatedAt: new Date().toISOString(),
  sourceAppPath: APP_PATH,
  commands: Object.fromEntries(COMMAND_NAMES.map((name) => [name, parseCommand(name)])),
  objects: Object.fromEntries(CLASS_NAMES.map((name) => [toObjectKey(name), parseClass(name)])),
  enums: Object.fromEntries(ENUM_NAMES.map((name) => [name, parseEnum(name)]))
};

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(schema, null, 2)}\n`, "utf8");

function parseCommand(name) {
  const block = requireSingleBlock("command", name);

  return {
    name,
    cliName: toCliCommandName(name),
    methodName: toAccessorName(name),
    description: extractAttribute(block.attributes, "description") ?? "",
    directParameter: parseDirectParameter(block.body),
    parameters: [...block.body.matchAll(/<parameter name="([^"]+)"([^>]*)>([\s\S]*?)<\/parameter>/gu)].map(
      (match) => {
        const parameterName = match[1];
        const attrs = match[2] ?? "";
        const body = match[3] ?? "";
        return {
          name: parameterName,
          key: toAccessorName(parameterName),
          optionName: toOptionName(parameterName),
          optional: extractAttribute(attrs, "optional") === "yes",
          description: extractAttribute(attrs, "description") ?? "",
          types: parseTypeRefs(attrs, body)
        };
      }
    ),
    result: parseResult(block.body)
  };
}

function parseClass(name) {
  const blocks = findBlocks("class", name);
  const properties = dedupeProperties(
    blocks.flatMap((block) =>
      [...block.body.matchAll(/<property name="([^"]+)"([^>]*)>([\s\S]*?)<\/property>/gu)].map(
        (match) => {
          const propertyName = match[1];
          const attrs = match[2] ?? "";
          const body = match[3] ?? "";
          return {
            name: propertyName,
            key: toAccessorName(propertyName),
            access: extractAttribute(attrs, "access") ?? "rw",
            writable: extractAttribute(attrs, "access") !== "r",
            type: parseTypeRefs(attrs, body)[0]?.name ?? "any",
            description: extractAttribute(attrs, "description") ?? "",
            inProperties: extractAttribute(attrs, "in-properties") !== "no"
          };
        }
      )
    )
  );

  return {
    scriptClass: name,
    properties
  };
}

function parseEnum(name) {
  const block = requireSingleBlock("enumeration", name);
  return [...block.body.matchAll(/<enumerator name="([^"]+)"/gu)].map((match) => match[1]);
}

function parseDirectParameter(body) {
  const match = body.match(/<direct-parameter([^>]*)>([\s\S]*?)<\/direct-parameter>/u);
  if (!match) {
    return null;
  }

  return {
    name: "value",
    key: "value",
    optionName: "value",
    optional: extractAttribute(match[1] ?? "", "optional") === "yes",
    description: extractAttribute(match[1] ?? "", "description") ?? "",
    types: parseTypeRefs(match[1] ?? "", match[2] ?? "")
  };
}

function parseResult(body) {
  const match = body.match(/<result([^>]*)>([\s\S]*?)<\/result>/u);
  if (!match) {
    return [];
  }

  return parseTypeRefs(match[1] ?? "", match[2] ?? "");
}

function parseTypeRefs(attrs, body) {
  const refs = [];
  const inlineType = extractAttribute(attrs, "type");
  if (inlineType) {
    refs.push({
      name: inlineType,
      list: extractAttribute(attrs, "list") === "yes"
    });
  }

  for (const match of body.matchAll(/<type type="([^"]+)"([^>]*)\/?>/gu)) {
    refs.push({
      name: match[1],
      list: extractAttribute(match[2] ?? "", "list") === "yes"
    });
  }

  return refs;
}

function requireSingleBlock(tagName, name) {
  const blocks = findBlocks(tagName, name);
  if (blocks.length === 0) {
    throw new Error(`Unable to find <${tagName} name="${name}"> in DEVONthink sdef.`);
  }

  return blocks[blocks.length - 1];
}

function findBlocks(tagName, name) {
  const escaped = escapeForRegex(name);
  const regex = new RegExp(
    `<${tagName} name="${escaped}"([^>]*)>([\\s\\S]*?)<\\/${tagName}>`,
    "gu"
  );

  return [...xml.matchAll(regex)].map((match) => ({
    attributes: match[1] ?? "",
    body: match[2] ?? ""
  }));
}

function extractAttribute(source, attribute) {
  const match = source.match(new RegExp(`${escapeForRegex(attribute)}="([^"]+)"`, "u"));
  return match?.[1];
}

function escapeForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function toCliCommandName(name) {
  return name.replaceAll(" ", "-").toLowerCase();
}

function toOptionName(name) {
  return name.replaceAll(" ", "-").toLowerCase();
}

function dedupeProperties(properties) {
  const seen = new Set();
  const result = [];

  for (const property of properties) {
    if (seen.has(property.name)) {
      continue;
    }
    seen.add(property.name);
    result.push(property);
  }

  return result;
}

function toObjectKey(name) {
  return name === "parent" ? "group" : name;
}

function toAccessorName(name) {
  const specialFirst = new Map([
    ["URL", "url"],
    ["UUID", "uuid"],
    ["MIME", "mime"],
    ["PDF", "pdf"],
    ["HTML", "html"],
    ["XML", "xml"],
    ["RTF", "rtf"],
    ["RTFD", "rtfd"],
    ["OCR", "ocr"]
  ]);
  const specialRest = new Map([
    ["URL", "URL"],
    ["UUID", "Uuid"],
    ["MIME", "MIME"],
    ["PDF", "PDF"],
    ["HTML", "HTML"],
    ["XML", "XML"],
    ["RTF", "RTF"],
    ["RTFD", "RTFD"],
    ["OCR", "OCR"]
  ]);

  const tokens = name
    .replace(/[()]/gu, " ")
    .split(/[\s/]+/u)
    .filter(Boolean);

  return tokens
    .map((token, index) => {
      if (index === 0) {
        return specialFirst.get(token) ?? normalizeToken(token, false);
      }

      return specialRest.get(token) ?? normalizeToken(token, true);
    })
    .join("");
}

function normalizeToken(token, capitalize) {
  const lower = token.toLowerCase();
  if (!capitalize) {
    return lower;
  }
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
