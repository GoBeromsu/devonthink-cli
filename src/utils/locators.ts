import { ValidationError } from "../application/errors.js";
import type {
  ContainerReference,
  DatabaseSelector,
  GroupReference,
  GroupSelector,
  RecordReference,
  RecordSelector
} from "../application/types.js";
import {
  getOption,
  type ParsedArgs
} from "./args.js";

export function buildGroupRef(
  parsed: ParsedArgs,
  dbOption: string,
  atOption: string,
  options?: { required?: boolean; requireAt?: boolean }
): GroupReference | undefined {
  const db = getOption(parsed, dbOption);
  const at = getOption(parsed, atOption);

  if (!db && !at) {
    if (options?.required) {
      throw new ValidationError(`Missing required option: --${dbOption}.`);
    }
    return undefined;
  }

  if (!db) {
    throw new ValidationError(`Missing required option: --${dbOption}.`);
  }

  if (options?.requireAt && !at) {
    throw new ValidationError(`Missing required option: --${atOption}.`);
  }

  return {
    $type: "group",
    locator: { database: { identifier: db }, at }
  };
}

export function buildContainerRef(
  parsed: ParsedArgs,
  dbOption: string,
  atOption?: string,
  options?: { required?: boolean }
): ContainerReference | undefined {
  const db = getOption(parsed, dbOption);
  const at = atOption ? getOption(parsed, atOption) : undefined;

  if (!db && !at) {
    if (options?.required) {
      throw new ValidationError(`Missing required option: --${dbOption}.`);
    }
    return undefined;
  }

  if (!db) {
    throw new ValidationError(`Missing required option: --${dbOption}.`);
  }

  return {
    $type: "container",
    locator: { database: { identifier: db }, at }
  };
}

export function buildRecordRef(
  parsed: ParsedArgs,
  uuidOption: string,
  options?: { required?: boolean }
): RecordReference | undefined {
  const uuid = getOption(parsed, uuidOption);

  if (!uuid) {
    if (options?.required) {
      throw new ValidationError(`Missing required option: --${uuidOption}.`);
    }
    return undefined;
  }

  return {
    $type: "record",
    locator: { uuid }
  };
}

export function databaseSelectorFromNameOrUuid(
  parsed: ParsedArgs,
  label = "database"
): DatabaseSelector {
  const name = getOption(parsed, "name");
  const uuid = getOption(parsed, "uuid");

  if (name && uuid) {
    throw new ValidationError(`Specify only one of --name or --uuid for ${label}.`);
  }

  if (!name && !uuid) {
    throw new ValidationError(`Missing required locator for ${label}: --name or --uuid.`);
  }

  return { name, uuid };
}

export function databaseSelectorFromIdentifier(
  parsed: ParsedArgs,
  optionName = "database",
  label = "database"
): DatabaseSelector {
  const identifier = getOption(parsed, optionName);

  if (!identifier) {
    throw new ValidationError(`Missing required option for ${label}: --${optionName}.`);
  }

  return { identifier };
}

export function groupSelectorFromDatabaseOption(
  parsed: ParsedArgs,
  options: {
    databaseOption?: string;
    atOption?: string;
    requireAt?: boolean;
    label?: string;
  } = {}
): GroupSelector {
  const databaseOption = options.databaseOption ?? "database";
  const atOption = options.atOption ?? "at";
  const label = options.label ?? "group";
  const selector: GroupSelector = {
    database: databaseSelectorFromIdentifier(parsed, databaseOption, label),
    at: getOption(parsed, atOption)
  };

  if (options.requireAt && !selector.at) {
    throw new ValidationError(`Missing required option for ${label}: --${atOption}.`);
  }

  return selector;
}

export function recordSelectorFromUuidOrPath(parsed: ParsedArgs): RecordSelector {
  const uuid = getOption(parsed, "uuid");
  const database = getOption(parsed, "database");
  const at = getOption(parsed, "at");

  if (uuid && (database || at)) {
    throw new ValidationError(
      "Record locator accepts either --uuid or --database with --at, not both."
    );
  }

  if (uuid) {
    return {
      uuid,
      database: database ? { identifier: database } : undefined
    };
  }

  if (database && at) {
    return {
      database: { identifier: database },
      at
    };
  }

  if (database || at) {
    throw new ValidationError("Record path lookup requires both --database and --at.");
  }

  throw new ValidationError("Record locator requires --uuid or --database with --at.");
}
