import { ValidationError } from "../application/errors.js";
import type {
  ContainerReference,
  DatabaseReference,
  DatabaseSelector,
  GroupReference,
  GroupSelector,
  RecordReference,
  RecordSelector
} from "../application/types.js";
import {
  getOption,
  getOptions,
  type ParsedArgs
} from "./args.js";

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

export function readRecordReference(
  parsed: ParsedArgs,
  role: string,
  options: {
    required?: boolean;
    allowMany?: boolean;
  } = {}
): RecordReference | RecordReference[] | undefined {
  const uuidOption = `${role}-uuid`;
  const databaseOption = `${role}-database`;
  const atOption = `${role}-at`;
  const uuids = getOptions(parsed, uuidOption);
  const database = getOption(parsed, databaseOption);
  const at = getOption(parsed, atOption);

  if (uuids.length > 0 && (database || at)) {
    throw new ValidationError(
      `Specify ${role} using either --${uuidOption} or --${databaseOption} with --${atOption}.`
    );
  }

  if (uuids.length > 0) {
    if (!options.allowMany && uuids.length > 1) {
      throw new ValidationError(`--${uuidOption} can only be provided once.`);
    }

    const references = uuids.map<RecordReference>((uuid) => ({
      $type: "record",
      locator: { uuid }
    }));

    return options.allowMany ? references : references[0];
  }

  if (database || at) {
    if (!database || !at) {
      throw new ValidationError(
        `${role} path lookup requires both --${databaseOption} and --${atOption}.`
      );
    }

    return {
      $type: "record",
      locator: {
        database: { identifier: database },
        at
      }
    };
  }

  if (options.required) {
    throw new ValidationError(
      `Missing required locator for ${role}: --${uuidOption} or --${databaseOption} with --${atOption}.`
    );
  }

  return undefined;
}

export function readContainerReference(
  parsed: ParsedArgs,
  role: string,
  options: {
    required?: boolean;
    allowDatabaseOnly?: boolean;
  } = {}
): ContainerReference | GroupReference | DatabaseReference | undefined {
  const databaseOption = `${role}-database`;
  const atOption = `${role}-at`;
  const database = getOption(parsed, databaseOption);
  const at = getOption(parsed, atOption);

  if (!database && !at) {
    if (options.required) {
      throw new ValidationError(
        `Missing required locator for ${role}: --${databaseOption}${options.allowDatabaseOnly ? "" : ` and --${atOption}`}.`
      );
    }

    return undefined;
  }

  if (!database) {
    throw new ValidationError(`Missing required option for ${role}: --${databaseOption}.`);
  }

  const locator: GroupSelector = {
    database: { identifier: database },
    at
  };

  if (!at && !options.allowDatabaseOnly) {
    return {
      $type: "group",
      locator
    };
  }

  if (!at && options.allowDatabaseOnly) {
    return {
      $type: "container",
      locator
    };
  }

  return {
    $type: options.allowDatabaseOnly ? "container" : "group",
    locator
  };
}
