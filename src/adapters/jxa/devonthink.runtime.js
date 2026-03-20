function run(argv) {
  try {
    var payload = JSON.parse(argv[0] || "{}");
    var app = Application("DEVONthink");
    app.includeStandardAdditions = true;
    var result = dispatch(app, payload.operation, payload.input || {});
    console.log(JSON.stringify({ ok: true, result: result }));
  } catch (error) {
    console.log(JSON.stringify({ ok: false, error: serializeError(error) }));
  }
}

function dispatch(app, operation, input) {
  switch (operation) {
    case "getApplication":
      return serializeEntity(app, input.propertyRequest, input.schemaObjects || null);
    case "listDatabases":
      return toArray(app.databases()).map(function (database) {
        return serializeEntity(database, input.propertyRequest, input.schemaObjects || null);
      });
    case "getDatabase":
      return serializeEntity(
        resolveDatabase(app, input.locator),
        input.propertyRequest,
        input.schemaObjects || null
      );
    case "setDatabase": {
      var database = resolveDatabase(app, input.locator);
      applyPropertyValues(app, database, input.values || {}, input.propertyRequest.propertySpecs);
      return serializeEntity(database, input.propertyRequest, input.schemaObjects || null);
    }
    case "listGroups": {
      var parent = resolveGroup(app, input.locator);
      return toArray(parent.children())
        .filter(isParentRecord)
        .map(function (group) {
          return serializeEntity(group, input.propertyRequest, input.schemaObjects || null);
        });
    }
    case "getGroup":
      return serializeEntity(
        resolveGroup(app, input.locator),
        input.propertyRequest,
        input.schemaObjects || null
      );
    case "setGroup": {
      var group = resolveGroup(app, input.locator);
      applyPropertyValues(app, group, input.values || {}, input.propertyRequest.propertySpecs);
      return serializeEntity(group, input.propertyRequest, input.schemaObjects || null);
    }
    case "getRecord":
      return serializeEntity(
        resolveRecord(app, input.locator),
        input.propertyRequest,
        input.schemaObjects || null
      );
    case "setRecord": {
      var record = resolveRecord(app, input.locator);
      applyPropertyValues(app, record, input.values || {}, input.propertyRequest.propertySpecs);
      return serializeEntity(record, input.propertyRequest, input.schemaObjects || null);
    }
    case "invokeCommand":
      return invokeCommand(app, input);
    default:
      throw appError("VALIDATION_ERROR", "Unsupported JXA operation: " + operation);
  }
}

function invokeCommand(app, input) {
  var command = app[input.methodName];
  if (typeof command !== "function") {
    throw appError("VALIDATION_ERROR", "Unsupported DEVONthink command: " + input.commandName);
  }

  var parameters = resolveCommandParameters(app, input.parameters || {}, input.schemaObjects || null);
  var directValue = normalizeDirectValue(app, input.commandName, input.directValue, input.schemaObjects || null);
  var hasParameters = Object.keys(parameters).length > 0;
  var result;

  if (directValue !== undefined) {
    result = hasParameters ? command.call(app, directValue, parameters) : command.call(app, directValue);
  } else if (hasParameters) {
    result = command.call(app, parameters);
  } else {
    result = command.call(app);
  }

  return serializeCommandResult(result, input.schemaObjects || null);
}

function resolveCommandParameters(app, parameters, schemaObjects) {
  var resolved = {};
  Object.keys(parameters).forEach(function (key) {
    var value = parameters[key];
    if (key === "withProperties" && isPlainObject(value)) {
      resolved[key] = normalizePropertyDictionary(
        app,
        value,
        schemaObjects && schemaObjects.record ? schemaObjects.record.properties : []
      );
      return;
    }

    resolved[key] = resolveCommandValue(app, value);
  });
  return resolved;
}

function normalizeDirectValue(app, commandName, value, schemaObjects) {
  if (value === undefined) {
    return undefined;
  }

  if (commandName === "create record with" && isPlainObject(value)) {
    return normalizePropertyDictionary(
      app,
      value,
      schemaObjects && schemaObjects.record ? schemaObjects.record.properties : []
    );
  }

  return resolveCommandValue(app, value);
}

function normalizePropertyDictionary(app, value, propertySpecs) {
  var normalized = {};

  Object.keys(value).forEach(function (key) {
    var spec = findPropertySpec(propertySpecs, key);
    var outputKey = spec ? spec.key : key;
    normalized[outputKey] = resolveCommandValue(app, value[key]);
  });

  return normalized;
}

function resolveCommandValue(app, value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(function (entry) {
      return resolveCommandValue(app, entry);
    });
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (isReference(value)) {
    return resolveReference(app, value);
  }

  if (isPlainObject(value)) {
    var result = {};
    Object.keys(value).forEach(function (key) {
      result[key] = resolveCommandValue(app, value[key]);
    });
    return result;
  }

  return value;
}

function resolveReference(app, value) {
  switch (value.$type) {
    case "database":
      return resolveDatabase(app, value.locator);
    case "group":
      return resolveGroup(app, value.locator);
    case "container":
      return value.locator && value.locator.at
        ? resolveGroup(app, value.locator)
        : resolveDatabase(app, value.locator.database);
    case "record":
      return resolveRecord(app, value.locator);
    default:
      throw appError("VALIDATION_ERROR", "Unsupported reference type: " + value.$type);
  }
}

function resolveDatabase(app, locator) {
  var databases = toArray(app.databases());
  var matches = [];

  if (!locator) {
    throw appError("VALIDATION_ERROR", "Missing database locator.");
  }

  if (locator.uuid) {
    matches = databases.filter(function (database) {
      return safeString(function () {
        return database.uuid();
      }) === locator.uuid;
    });
  } else if (locator.name) {
    matches = databases.filter(function (database) {
      return safeString(function () {
        return database.name();
      }) === locator.name;
    });
  } else if (locator.identifier) {
    matches = databases.filter(function (database) {
      return safeString(function () {
        return database.uuid();
      }) === locator.identifier;
    });

    if (matches.length === 0) {
      matches = databases.filter(function (database) {
        return safeString(function () {
          return database.name();
        }) === locator.identifier;
      });
    }
  }

  if (matches.length === 0) {
    throw appError("NOT_FOUND", "Database not found.");
  }

  if (matches.length > 1) {
    throw appError("VALIDATION_ERROR", "Database locator is ambiguous.");
  }

  return matches[0];
}

function resolveGroup(app, locator) {
  var database;
  var group;

  if (!locator || !locator.database) {
    throw appError("VALIDATION_ERROR", "Missing group locator.");
  }

  database = resolveDatabase(app, locator.database);
  if (!locator.at || locator.at === "/") {
    return database.root();
  }

  group = app.getRecordAt(locator.at, { in: database });
  if (!group) {
    throw appError("NOT_FOUND", "Group not found: " + locator.at);
  }

  if (!isParentRecord(group)) {
    throw appError("VALIDATION_ERROR", "Record is not a group/parent object: " + locator.at);
  }

  return group;
}

function resolveRecord(app, locator) {
  var database;
  var record;

  if (!locator) {
    throw appError("VALIDATION_ERROR", "Missing record locator.");
  }

  if (locator.uuid) {
    if (locator.database) {
      database = resolveDatabase(app, locator.database);
      record = app.getRecordWithUuid(locator.uuid, { in: database });
    } else {
      record = app.getRecordWithUuid(locator.uuid);
    }

    if (!record) {
      throw appError("NOT_FOUND", "Record not found: " + locator.uuid);
    }

    return record;
  }

  if (!locator.database || !locator.at) {
    throw appError("VALIDATION_ERROR", "Record locator requires uuid or database + path.");
  }

  database = resolveDatabase(app, locator.database);
  record = app.getRecordAt(locator.at, { in: database });
  if (!record) {
    throw appError("NOT_FOUND", "Record not found: " + locator.at);
  }

  return record;
}

function applyPropertyValues(app, entity, values, propertySpecs) {
  Object.keys(values).forEach(function (name) {
    var spec = findPropertySpec(propertySpecs, name);
    if (!spec) {
      throw appError("VALIDATION_ERROR", "Unknown property: " + name);
    }
    entity[spec.key] = resolveCommandValue(app, values[name]);
  });
}

function serializeEntity(entity, propertyRequest, schemaObjects) {
  var propertySpecs = propertyRequest.propertySpecs || [];
  var selected = propertyRequest.selectedProperties;
  var result = {};
  var bag;

  if (selected && selected.length > 0) {
    selected.forEach(function (name) {
      var spec = findPropertySpec(propertySpecs, name);
      if (!spec) {
        throw appError("VALIDATION_ERROR", "Unknown property: " + name);
      }
      result[spec.name] = serializeNestedValue(
        readProperty(entity, spec),
        schemaObjects
      );
    });
    return result;
  }

  bag = safeValue(function () {
    return typeof entity.properties === "function" ? entity.properties() : null;
  }, null);

  propertySpecs
    .forEach(function (spec) {
      if (bag && typeof bag === "object" && Object.prototype.hasOwnProperty.call(bag, spec.key)) {
        result[spec.name] = serializeNestedValue(bag[spec.key], schemaObjects);
        return;
      }

      if (spec.inProperties === false) {
        return;
      }

      var value = readProperty(entity, spec);
      if (value !== undefined) {
        result[spec.name] = serializeNestedValue(value, schemaObjects);
      }
    });

  return result;
}

function serializeCommandResult(value, schemaObjects) {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(function (entry) {
      return serializeCommandListItem(entry, schemaObjects);
    });
  }

  if (isJxaList(value)) {
    return toArray(value).map(function (entry) {
      return serializeCommandListItem(entry, schemaObjects);
    });
  }

  var kind = detectObjectKind(value);
  if (kind) {
    return serializeCommandEntity(value, kind, schemaObjects);
  }

  return serializeNestedValue(value, schemaObjects);
}

function serializeCommandListItem(value, schemaObjects) {
  if (value === null || value === undefined) {
    return null;
  }

  var kind = detectObjectKind(value);
  if (kind) {
    return serializeReference(value, kind, schemaObjects);
  }

  return serializeNestedValue(value, schemaObjects);
}

function serializeCommandEntity(entity, kind, schemaObjects) {
  var propertyRequest = defaultPropertyRequestForKind(kind, schemaObjects);
  if (!propertyRequest) {
    return serializeReference(entity, kind, schemaObjects);
  }

  return serializeEntity(entity, propertyRequest, schemaObjects);
}

function defaultPropertyRequestForKind(kind, schemaObjects) {
  if (!schemaObjects || !schemaObjects[kind] || !schemaObjects[kind].properties) {
    return null;
  }

  return {
    propertySpecs: schemaObjects[kind].properties,
    selectedProperties: null
  };
}

function serializeNestedValue(value, schemaObjects) {
  var kind;

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (isDateValue(value)) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(function (entry) {
      return serializeNestedValue(entry, schemaObjects);
    });
  }

  if (isJxaList(value)) {
    return toArray(value).map(function (entry) {
      return serializeNestedValue(entry, schemaObjects);
    });
  }

  kind = detectObjectKind(value);
  if (kind) {
    return serializeReference(value, kind, schemaObjects);
  }

  if (isPlainObject(value)) {
    var result = {};
    Object.keys(value).forEach(function (key) {
      result[key] = serializeNestedValue(value[key], schemaObjects);
    });
    return result;
  }

  return safeString(function () {
    return value.toString();
  }, "");
}

function serializeReference(entity, kind, schemaObjects) {
  // Try batch property read first for performance
  var bag = safeValue(function () {
    return typeof entity.properties === "function" ? entity.properties() : null;
  }, null);

  if (bag && typeof bag === "object") {
    return serializeReferenceFromBag(bag, kind);
  }

  // Fallback to individual property access
  switch (kind) {
    case "database":
      return compactObject({
        name: safeValue(function () {
          return entity.name();
        }, null),
        uuid: safeValue(function () {
          return entity.uuid();
        }, null),
        path: safeValue(function () {
          return entity.path();
        }, null)
      });
    case "group":
      return compactObject({
        name: safeValue(function () {
          return entity.name();
        }, null),
        uuid: safeValue(function () {
          return entity.uuid();
        }, null),
        location: safeValue(function () {
          return entity.location();
        }, null),
        path: safeValue(function () {
          return typeof entity.path === "function" ? entity.path() : null;
        }, null),
        "record type": safeValue(function () {
          return entity.recordType();
        }, null)
      });
    case "record":
      return compactObject({
        name: safeValue(function () {
          return entity.name();
        }, null),
        uuid: safeValue(function () {
          return entity.uuid();
        }, null),
        location: safeValue(function () {
          return entity.location();
        }, null),
        path: safeValue(function () {
          return typeof entity.path === "function" ? entity.path() : null;
        }, null),
        "record type": safeValue(function () {
          return entity.recordType();
        }, null)
      });
    default:
      return compactObject({
        name: safeValue(function () {
          return entity.name();
        }, null)
      });
  }
}

function serializeReferenceFromBag(bag, kind) {
  switch (kind) {
    case "database":
      return compactObject({
        name: bag.name || null,
        uuid: bag.uuid || null,
        path: bag.path || null
      });
    case "group":
    case "record":
      return compactObject({
        name: bag.name || null,
        uuid: bag.uuid || null,
        location: bag.location || null,
        path: bag.path || null,
        "record type": bag.recordType || null
      });
    default:
      return compactObject({ name: bag.name || null });
  }
}

function readProperty(entity, spec) {
  var bag = safeValue(function () {
    return typeof entity.properties === "function" ? entity.properties() : null;
  }, null);

  if (bag && typeof bag === "object" && Object.prototype.hasOwnProperty.call(bag, spec.key)) {
    return bag[spec.key];
  }

  if (typeof entity[spec.key] === "function") {
    return entity[spec.key]();
  }

  if (Object.prototype.hasOwnProperty.call(entity, spec.key)) {
    return entity[spec.key];
  }

  return undefined;
}

function findPropertySpec(propertySpecs, name) {
  var needle = String(name).toLowerCase();
  return propertySpecs.find(function (spec) {
    return spec.name.toLowerCase() === needle || spec.key.toLowerCase() === needle;
  });
}

function detectObjectKind(value) {
  var recordType;
  if (!value || (typeof value !== "object" && typeof value !== "function")) {
    return null;
  }

  recordType = safeValue(function () {
    return typeof value.recordType === "function" ? value.recordType() : null;
  }, null);

  if (recordType) {
    if (typeof value.children === "function") {
      return "group";
    }
    return "record";
  }

  if (
    safeValue(function () {
      return typeof value.versioning === "function" ? value.versioning() : undefined;
    }, undefined) !== undefined ||
    safeValue(function () {
      return typeof value.filename === "function" ? value.filename() : undefined;
    }, undefined) !== undefined
  ) {
    return "database";
  }

  if (
    typeof value.databases === "function" ||
    safeValue(function () {
      return typeof value.version === "function" ? value.version() : undefined;
    }, undefined) !== undefined
  ) {
    return "application";
  }

  return null;
}

function isParentRecord(record) {
  return !!record && typeof record.children === "function";
}

function isReference(value) {
  return (
    isPlainObject(value) &&
    typeof value.$type === "string" &&
    value.locator &&
    typeof value.locator === "object"
  );
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function isDateValue(value) {
  return Object.prototype.toString.call(value) === "[object Date]";
}

function isJxaList(value) {
  return (
    !!value &&
    typeof value === "object" &&
    typeof value.length === "number" &&
    typeof value[Symbol.iterator] === "function"
  );
}

function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.from(value);
}

function safeValue(getter, fallback) {
  try {
    var value = getter();
    if (value === undefined || value === null) {
      return fallback;
    }
    return value;
  } catch (_error) {
    return fallback;
  }
}

function safeString(getter, fallback) {
  return String(safeValue(getter, fallback || ""));
}

function appError(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}

function serializeError(error) {
  return {
    code: error && error.code ? String(error.code) : "JXA_ERROR",
    message: error && error.message ? String(error.message) : String(error),
    name: error && error.name ? String(error.name) : "Error"
  };
}

function compactObject(value) {
  var result = {};
  Object.keys(value).forEach(function (key) {
    if (value[key] !== null && value[key] !== undefined) {
      result[key] = value[key];
    }
  });
  return result;
}
