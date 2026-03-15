import { CommandRegistry } from "../../src/commands/CommandRegistry.js";
import { devonthinkSchema } from "../../src/schema/index.js";
import {
  toErrorMessage,
  toExitCode
} from "../../src/application/errors.js";
import type {
  DatabaseSelector,
  DevonthinkCommandInput,
  GroupSelector,
  JsonValue,
  PropertyValue,
  RecordSelector
} from "../../src/application/types.js";
import type {
  DatabaseGetInput,
  DatabaseSetInput,
  DevonthinkPort,
  GroupGetInput,
  GroupListInput,
  GroupSetInput,
  OutputPort,
  PropertyReadInput,
  RecordGetInput,
  RecordSetInput
} from "../../src/application/ports.js";
import { AddCommand } from "../../src/commands/addCommand.js";
import { DeleteCommand } from "../../src/commands/deleteCommand.js";
import { MoveCommand } from "../../src/commands/moveCommand.js";
import { ListCommand } from "../../src/commands/listCommand.js";
import { SearchCommand } from "../../src/commands/searchCommand.js";
import { IndexCommand } from "../../src/commands/indexCommand.js";
import { PropertyGetCommand } from "../../src/commands/propertyGetCommand.js";
import { PropertySetCommand } from "../../src/commands/propertySetCommand.js";
import { CreateLocationCommand } from "../../src/commands/createLocationCommand.js";
import { CreateRecordCommand } from "../../src/commands/createRecordCommand.js";
import { LookupFileCommand } from "../../src/commands/lookupFileCommand.js";
import { LookupTagsCommand } from "../../src/commands/lookupTagsCommand.js";
import { LookupUrlCommand } from "../../src/commands/lookupUrlCommand.js";
import { LookupPathCommand } from "../../src/commands/lookupPathCommand.js";
import { AiClassifyCommand } from "../../src/commands/aiClassifyCommand.js";
import { AiCompareCommand } from "../../src/commands/aiCompareCommand.js";
import { RecordGetCommand } from "../../src/commands/recordGetCommand.js";
import { RecordDuplicateCommand } from "../../src/commands/recordDuplicateCommand.js";
import { RecordReplicateCommand } from "../../src/commands/recordReplicateCommand.js";

interface DatabaseEntity {
  id: string;
  name: string;
  uuid: string;
  path: string;
  comment: string | null;
  versioning: boolean;
  rootId: string;
  incomingGroupId: string;
}

interface GroupEntity {
  id: string;
  name: string;
  uuid: string;
  databaseId: string;
  dtPath: string;
  location: string;
  comment: string | null;
  color: JsonValue;
}

interface RecordEntity {
  id: string;
  name: string;
  uuid: string;
  databaseId: string;
  dtPath: string;
  location: string;
  recordType: string;
  comment: string | null;
  tags: string[];
  path: string | null;
  url: string | null;
  referenceUrl: string | null;
}

interface FakeState {
  databases: DatabaseEntity[];
  groups: GroupEntity[];
  records: RecordEntity[];
  nextId: number;
  commandCalls: DevonthinkCommandInput[];
}

class BufferOutput implements OutputPort {
  stdout = "";
  stderr = "";

  write(message: string): void {
    this.stdout += `${message}\n`;
  }

  writeError(message: string): void {
    this.stderr += `${message}\n`;
  }
}

export class FakeDevonthinkPort implements DevonthinkPort {
  readonly state: FakeState;

  constructor() {
    const personalRoot = "group-root-personal";
    const inboxRoot = "group-root-inbox";
    const projects = "group-projects";
    const projectsInbox = "group-projects-inbox";
    const archive = "group-archive";

    this.state = {
      databases: [
        {
          id: "db-personal",
          name: "01. Personal",
          uuid: "db-1",
          path: "/Users/beomsu/Library/Application Support/DEVONthink/01 Personal.dtBase2",
          comment: null,
          versioning: true,
          rootId: personalRoot,
          incomingGroupId: projectsInbox
        },
        {
          id: "db-inbox",
          name: "Inbox",
          uuid: "db-inbox",
          path: "/Users/beomsu/Library/Application Support/DEVONthink/Inbox.dtBase2",
          comment: null,
          versioning: false,
          rootId: inboxRoot,
          incomingGroupId: inboxRoot
        }
      ],
      groups: [
        {
          id: personalRoot,
          name: "01. Personal",
          uuid: "group-root-1",
          databaseId: "db-personal",
          dtPath: "/",
          location: "/",
          comment: null,
          color: null
        },
        {
          id: inboxRoot,
          name: "Inbox",
          uuid: "group-root-inbox",
          databaseId: "db-inbox",
          dtPath: "/",
          location: "/",
          comment: null,
          color: null
        },
        {
          id: projects,
          name: "Projects",
          uuid: "group-projects-1",
          databaseId: "db-personal",
          dtPath: "/Projects",
          location: "/",
          comment: "Active projects",
          color: null
        },
        {
          id: projectsInbox,
          name: "Inbox",
          uuid: "group-projects-inbox-1",
          databaseId: "db-personal",
          dtPath: "/Projects/Inbox",
          location: "/Projects",
          comment: null,
          color: null
        },
        {
          id: archive,
          name: "Archive",
          uuid: "group-archive-1",
          databaseId: "db-personal",
          dtPath: "/Projects/Archive",
          location: "/Projects",
          comment: null,
          color: null
        }
      ],
      records: [
        {
          id: "record-existing",
          name: "Existing.pdf",
          uuid: "record-existing-1",
          databaseId: "db-personal",
          dtPath: "/Projects/Existing.pdf",
          location: "/Projects",
          recordType: "PDF document",
          comment: "seed",
          tags: ["reference"],
          path: "/Users/beomsu/Downloads/Existing.pdf",
          url: null,
          referenceUrl: "https://example.com/existing"
        },
        {
          id: "record-url",
          name: "Article",
          uuid: "record-url-1",
          databaseId: "db-personal",
          dtPath: "/Projects/Article",
          location: "/Projects",
          recordType: "bookmark",
          comment: null,
          tags: ["llm", "reference"],
          path: null,
          url: "https://example.com/article",
          referenceUrl: "https://example.com/article"
        },
        {
          id: "record-inbox",
          name: "Capture.pdf",
          uuid: "record-inbox-1",
          databaseId: "db-inbox",
          dtPath: "/Capture.pdf",
          location: "/",
          recordType: "PDF document",
          comment: null,
          tags: [],
          path: "/Users/beomsu/Downloads/Capture.pdf",
          url: null,
          referenceUrl: null
        }
      ],
      nextId: 1,
      commandCalls: []
    };
  }

  async getApplication(input: PropertyReadInput): Promise<JsonValue> {
    const data = {
      name: "DEVONthink",
      inbox: this.databaseRef(this.requireDatabase({ identifier: "Inbox" })),
      "incoming group": this.groupRef(this.requireGroup(this.requireDatabase({ identifier: "Inbox" }).incomingGroupId)),
      "current group": this.groupRef(
        this.requireGroup(this.requireDatabase({ identifier: "db-1" }).rootId)
      )
    };

    return pickProperties(data, input.properties);
  }

  async listDatabases(input: PropertyReadInput): Promise<JsonValue[]> {
    return this.state.databases.map((database) =>
      pickProperties(this.databaseValue(database), input.properties)
    );
  }

  async getDatabase(input: DatabaseGetInput): Promise<JsonValue> {
    return pickProperties(
      this.databaseValue(this.requireDatabase(input.locator)),
      input.properties
    );
  }

  async setDatabase(input: DatabaseSetInput): Promise<JsonValue> {
    const database = this.requireDatabase(input.locator);
    applyValues(database as unknown as Record<string, unknown>, input.values);
    return pickProperties(this.databaseValue(database), input.properties);
  }

  async listGroups(input: GroupListInput): Promise<JsonValue[]> {
    const group = this.resolveGroupSelector(input.locator);
    return this.state.groups
      .filter(
        (candidate) =>
          candidate.databaseId === group.databaseId && candidate.location === group.dtPath
      )
      .map((candidate) => pickProperties(this.groupValue(candidate), input.properties));
  }

  async getGroup(input: GroupGetInput): Promise<JsonValue> {
    return pickProperties(
      this.groupValue(this.resolveGroupSelector(input.locator)),
      input.properties
    );
  }

  async setGroup(input: GroupSetInput): Promise<JsonValue> {
    const group = this.resolveGroupSelector(input.locator);
    applyValues(group as unknown as Record<string, unknown>, input.values);
    return pickProperties(this.groupValue(group), input.properties);
  }

  async getRecord(input: RecordGetInput): Promise<JsonValue> {
    return pickProperties(
      this.recordValue(this.resolveRecordSelector(input.locator)),
      input.properties
    );
  }

  async setRecord(input: RecordSetInput): Promise<JsonValue> {
    const record = this.resolveRecordSelector(input.locator);
    applyValues(record as unknown as Record<string, unknown>, input.values);
    return pickProperties(this.recordValue(record), input.properties);
  }

  async invokeCommand(input: DevonthinkCommandInput): Promise<JsonValue> {
    this.state.commandCalls.push(structuredClone(input));

    switch (input.commandName) {
      case "search":
        return this.search(input);
      case "import path":
      case "index path":
        return this.importPath(input);
      case "create location":
        return this.createLocation(input);
      case "create record with":
        return this.createRecordWith(input);
      case "get record at":
        return this.getRecordAt(input);
      case "get record with uuid":
        return this.getRecordWithUuid(input);
      case "lookup records with file":
        return this.lookupRecordsWithFile(input);
      case "lookup records with path":
        return this.lookupRecordsWithPath(input);
      case "lookup records with tags":
        return this.lookupRecordsWithTags(input);
      case "lookup records with URL":
        return this.lookupRecordsWithUrl(input);
      case "move":
        return this.moveRecords(input);
      case "delete":
        return this.deleteRecords(input);
      case "duplicate":
      case "replicate":
        return this.duplicateRecords(input);
      case "compare":
        return this.compareRecords(input);
      case "classify":
        return this.classifyRecord(input);
      default:
        throw new Error(`Unsupported fake command: ${input.commandName}`);
    }
  }

  private search(input: DevonthinkCommandInput): JsonValue {
    const query = String(input.directValue ?? "");
    const container = input.parameters?.in;
    const records = this.recordsInScope(container);
    const filtered = records.filter((record) => matchesSearch(record, query));
    return filtered.map((record) => this.recordValue(record));
  }

  private importPath(input: DevonthinkCommandInput): JsonValue {
    const destination = this.resolveGroupReference(
      requirePropertyValue(input.parameters?.to, "to")
    );
    const source = String(input.directValue ?? "");
    const requestedName = asString(input.parameters?.name);
    const name = requestedName ?? basename(source);
    const record = this.createRecord(destination.databaseId, destination.dtPath, {
      name,
      recordType: input.commandName === "index path" ? "indexed" : "PDF document",
      path: source
    });
    return this.recordValue(record);
  }

  private createLocation(input: DevonthinkCommandInput): JsonValue {
    const rawPath = String(input.directValue ?? "");
    const container = input.parameters?.in as PropertyValue | undefined;
    const base = container
      ? this.resolveContainerReference(container)
      : { database: this.requireDatabase({ identifier: "db-1" }), basePath: "/" };
    const group = this.ensureGroupPath(base.database.id, joinLocation(base.basePath, rawPath));
    return this.groupValue(group);
  }

  private createRecordWith(input: DevonthinkCommandInput): JsonValue {
    const destination = input.parameters?.in
      ? this.resolveGroupReference(input.parameters.in as PropertyValue)
      : this.requireGroup(this.requireDatabase({ identifier: "db-1" }).incomingGroupId);
    const properties = (input.directValue ?? {}) as Record<string, JsonValue>;
    const record = this.createRecord(destination.databaseId, destination.dtPath, {
      name: asString(properties.name) ?? "Untitled",
      recordType:
        asString(properties.type) ??
        asString(properties["record type"]) ??
        "txt",
      path: asString(properties.path) ?? null,
      url: asString(properties.URL) ?? asString(properties.url) ?? null
    });
    applyValues(record as unknown as Record<string, unknown>, properties);
    return this.recordValue(record);
  }

  private getRecordAt(input: DevonthinkCommandInput): JsonValue {
    const rawPath = String(input.directValue ?? "");
    const container = input.parameters?.in
      ? this.resolveContainerReference(input.parameters.in as PropertyValue)
      : { database: this.requireDatabase({ identifier: "db-1" }), basePath: "/" };
    const targetPath = rawPath.startsWith("/") ? rawPath : joinLocation(container.basePath, rawPath);
    const record = this.findRecordByDtPath(container.database.id, targetPath)
      ?? this.findGroupByDtPath(container.database.id, targetPath);
    if (!record) {
      throw new Error(`Record not found at ${targetPath}`);
    }
    return isGroupEntity(record) ? this.groupValue(record) : this.recordValue(record);
  }

  private getRecordWithUuid(input: DevonthinkCommandInput): JsonValue {
    const uuid = String(input.directValue ?? "");
    const record = this.state.records.find((candidate) => candidate.uuid === uuid);
    if (!record) {
      throw new Error(`Record not found: ${uuid}`);
    }
    return this.recordValue(record);
  }

  private lookupRecordsWithFile(input: DevonthinkCommandInput): JsonValue {
    const needle = String(input.directValue ?? "");
    return this.lookupInDatabase(input.parameters?.in, (record) => basename(record.path ?? "") === needle);
  }

  private lookupRecordsWithPath(input: DevonthinkCommandInput): JsonValue {
    const needle = String(input.directValue ?? "");
    return this.lookupInDatabase(input.parameters?.in, (record) => record.path === needle);
  }

  private lookupRecordsWithTags(input: DevonthinkCommandInput): JsonValue {
    const values = Array.isArray(input.directValue) ? input.directValue : [input.directValue];
    const tags = values.map((entry) => String(entry));
    const any = Boolean(input.parameters?.any);
    return this.lookupInDatabase(input.parameters?.in, (record) =>
      any
        ? tags.some((tag) => record.tags.includes(tag))
        : tags.every((tag) => record.tags.includes(tag))
    );
  }

  private lookupRecordsWithUrl(input: DevonthinkCommandInput): JsonValue {
    const needle = String(input.directValue ?? "");
    return this.lookupInDatabase(
      input.parameters?.in,
      (record) => record.url === needle || record.referenceUrl === needle
    );
  }

  private moveRecords(input: DevonthinkCommandInput): JsonValue {
    const records = this.resolveRecordInputs(input.parameters?.record);
    const destination = this.resolveGroupReference(input.parameters?.to as PropertyValue);
    records.forEach((record) => {
      record.databaseId = destination.databaseId;
      record.location = destination.dtPath;
      record.dtPath = joinLocation(destination.dtPath, record.name);
    });
    return records.map((record) => this.recordValue(record));
  }

  private deleteRecords(input: DevonthinkCommandInput): JsonValue {
    const records = this.resolveRecordInputs(input.parameters?.record);
    for (const record of records) {
      this.state.records = this.state.records.filter((candidate) => candidate.id !== record.id);
    }
    return true;
  }

  private duplicateRecords(input: DevonthinkCommandInput): JsonValue {
    const records = this.resolveRecordInputs(input.parameters?.record);
    const destination = this.resolveGroupReference(input.parameters?.to as PropertyValue);
    return records.map((record) =>
      this.recordValue(
        this.createRecord(destination.databaseId, destination.dtPath, {
          name: record.name,
          recordType: record.recordType,
          path: record.path,
          url: record.url,
          referenceUrl: record.referenceUrl,
          tags: [...record.tags],
          comment: record.comment
        })
      )
    );
  }

  private compareRecords(input: DevonthinkCommandInput): JsonValue {
    const content = asString(input.parameters?.content) ?? "";
    if (content) {
      return this.state.records
        .filter((record) => record.name.toLowerCase().includes(content.toLowerCase()))
        .map((record) => this.recordValue(record));
    }

    const recordRef = input.parameters?.record;
    const record = requireFirstRecord(this.resolveRecordInputs(recordRef));
    return this.state.records
      .filter((candidate) => candidate.id !== record.id && sharesTag(candidate, record))
      .map((candidate) => this.recordValue(candidate));
  }

  private classifyRecord(input: DevonthinkCommandInput): JsonValue {
    const record = requireFirstRecord(this.resolveRecordInputs(input.parameters?.record));
    const database = input.parameters?.in
      ? this.resolveDatabaseReference(input.parameters.in as PropertyValue)
      : this.requireDatabase({ identifier: record.databaseId });
    return this.state.groups
      .filter((group) => group.databaseId === database.id && group.location === "/")
      .map((group) => this.groupValue(group));
  }

  private lookupInDatabase(
    databaseValue: PropertyValue | undefined,
    predicate: (record: RecordEntity) => boolean
  ): JsonValue {
    const database = databaseValue
      ? this.resolveDatabaseReference(databaseValue)
      : undefined;
    return this.state.records
      .filter((record) => (database ? record.databaseId === database.id : true))
      .filter(predicate)
      .map((record) => this.recordValue(record));
  }

  private recordsInScope(containerValue: PropertyValue | undefined): RecordEntity[] {
    if (!containerValue) {
      return [...this.state.records];
    }

    const container = this.resolveContainerReference(containerValue);
    return this.state.records.filter(
      (record) =>
        record.databaseId === container.database.id &&
        record.dtPath.startsWith(container.basePath === "/" ? "/" : `${container.basePath}/`)
    );
  }

  private resolveContainerReference(value: PropertyValue): {
    database: DatabaseEntity;
    basePath: string;
  } {
    if (!isReference(value)) {
      throw new Error("Expected container reference.");
    }

    if (value.$type === "database") {
      return {
        database: this.requireDatabase(value.locator),
        basePath: "/"
      };
    }

    if (value.$type === "container") {
      const database = this.requireDatabase(value.locator.database);
      return {
        database,
        basePath: value.locator.at ?? "/"
      };
    }

    if (value.$type === "group") {
      const group = this.resolveGroupSelector(value.locator);
      return {
        database: this.requireDatabase({ identifier: group.databaseId }),
        basePath: group.dtPath
      };
    }

    throw new Error("Expected group or database reference.");
  }

  private resolveGroupReference(value: PropertyValue): GroupEntity {
    const container = this.resolveContainerReference(value);
    return container.basePath === "/"
      ? this.requireGroup(container.database.rootId)
      : this.requireGroupByDtPath(container.database.id, container.basePath);
  }

  private resolveDatabaseReference(value: PropertyValue): DatabaseEntity {
    if (!isReference(value)) {
      throw new Error("Expected database reference.");
    }

    if (value.$type === "database") {
      return this.requireDatabase(value.locator);
    }

    if (value.$type === "container" || value.$type === "group") {
      return this.requireDatabase(value.locator.database);
    }

    if (value.$type === "record" && value.locator.database) {
      return this.requireDatabase(value.locator.database);
    }

    throw new Error("Expected database reference.");
  }

  private resolveRecordInputs(value: PropertyValue | undefined): RecordEntity[] {
    if (Array.isArray(value)) {
      return value.flatMap((entry) => this.resolveRecordInputs(entry));
    }

    if (!isReference(value) || value.$type !== "record") {
      throw new Error("Expected record reference.");
    }

    return [this.resolveRecordSelector(value.locator)];
  }

  private requireDatabase(locator: DatabaseSelector): DatabaseEntity {
    const matches = this.state.databases.filter((database) => {
      if (locator.uuid) {
        return database.uuid === locator.uuid;
      }
      if (locator.name) {
        return database.name === locator.name;
      }
      if (locator.identifier) {
        return database.uuid === locator.identifier || database.name === locator.identifier || database.id === locator.identifier;
      }
      return false;
    });

    if (matches.length !== 1) {
      throw new Error("Database not found.");
    }

    return matches[0] ?? unreachable("Database not found after filtering.");
  }

  private resolveGroupSelector(locator: GroupSelector): GroupEntity {
    const database = this.requireDatabase(locator.database);
    if (!locator.at || locator.at === "/") {
      return this.requireGroup(database.rootId);
    }
    return this.requireGroupByDtPath(database.id, locator.at);
  }

  private resolveRecordSelector(locator: RecordSelector): RecordEntity {
    if (locator.uuid) {
      const record = this.state.records.find((candidate) => candidate.uuid === locator.uuid);
      if (!record) {
        throw new Error("Record not found.");
      }
      return record;
    }

    if (!locator.database || !locator.at) {
      throw new Error("Record locator requires uuid or database + path.");
    }

    const database = this.requireDatabase(locator.database);
    return this.requireRecordByDtPath(database.id, locator.at);
  }

  private requireGroup(id: string): GroupEntity {
    const group = this.state.groups.find((candidate) => candidate.id === id);
    if (!group) {
      throw new Error("Group not found.");
    }
    return group;
  }

  private requireGroupByDtPath(databaseId: string, dtPath: string): GroupEntity {
    const group = this.findGroupByDtPath(databaseId, dtPath);
    if (!group) {
      throw new Error(`Group not found: ${dtPath}`);
    }
    return group;
  }

  private findGroupByDtPath(databaseId: string, dtPath: string): GroupEntity | undefined {
    return this.state.groups.find(
      (candidate) => candidate.databaseId === databaseId && candidate.dtPath === dtPath
    );
  }

  private requireRecordByDtPath(databaseId: string, dtPath: string): RecordEntity {
    const record = this.findRecordByDtPath(databaseId, dtPath);
    if (!record) {
      throw new Error(`Record not found: ${dtPath}`);
    }
    return record;
  }

  private findRecordByDtPath(databaseId: string, dtPath: string): RecordEntity | undefined {
    return this.state.records.find(
      (candidate) => candidate.databaseId === databaseId && candidate.dtPath === dtPath
    );
  }

  private createRecord(
    databaseId: string,
    location: string,
    input: {
      name: string;
      recordType: string;
      path?: string | null;
      url?: string | null;
      referenceUrl?: string | null;
      tags?: string[];
      comment?: string | null;
    }
  ): RecordEntity {
    const index = this.state.nextId++;
    const record = {
      id: `record-${index}`,
      name: input.name,
      uuid: `record-created-${index}`,
      databaseId,
      dtPath: joinLocation(location, input.name),
      location,
      recordType: input.recordType,
      comment: input.comment ?? null,
      tags: input.tags ?? [],
      path: input.path ?? null,
      url: input.url ?? null,
      referenceUrl: input.referenceUrl ?? input.url ?? null
    };
    this.state.records.push(record);
    return record;
  }

  private ensureGroupPath(databaseId: string, dtPath: string): GroupEntity {
    if (dtPath === "/") {
      return this.requireGroup(this.requireDatabase({ identifier: databaseId }).rootId);
    }

    const existing = this.findGroupByDtPath(databaseId, dtPath);
    if (existing) {
      return existing;
    }

    const segments = dtPath.split("/").filter(Boolean);
    let currentPath = "/";
    let currentGroup = this.requireGroup(this.requireDatabase({ identifier: databaseId }).rootId);

    for (const segment of segments) {
      const nextPath = joinLocation(currentPath, segment);
      const nextExisting = this.findGroupByDtPath(databaseId, nextPath);
      if (nextExisting) {
        currentGroup = nextExisting;
        currentPath = nextPath;
        continue;
      }

      const index = this.state.nextId++;
      const created = {
        id: `group-created-${index}`,
        name: segment,
        uuid: `group-created-${index}`,
        databaseId,
        dtPath: nextPath,
        location: currentPath,
        comment: null,
        color: null
      };
      this.state.groups.push(created);
      currentGroup = created;
      currentPath = nextPath;
    }

    return currentGroup;
  }

  private databaseValue(database: DatabaseEntity): Record<string, JsonValue> {
    return {
      name: database.name,
      uuid: database.uuid,
      path: database.path,
      comment: database.comment,
      versioning: database.versioning,
      root: this.groupRef(this.requireGroup(database.rootId)),
      "incoming group": this.groupRef(this.requireGroup(database.incomingGroupId)),
      "current group": this.groupRef(this.requireGroup(database.rootId))
    };
  }

  private groupValue(group: GroupEntity): Record<string, JsonValue> {
    return {
      name: group.name,
      uuid: group.uuid,
      location: group.location,
      path: null,
      comment: group.comment,
      color: group.color,
      "record type": "group",
      database: this.databaseRef(this.requireDatabase({ identifier: group.databaseId }))
    };
  }

  private recordValue(record: RecordEntity): Record<string, JsonValue> {
    return {
      name: record.name,
      uuid: record.uuid,
      location: record.location,
      path: record.path,
      comment: record.comment,
      tags: [...record.tags],
      URL: record.url,
      "reference URL": record.referenceUrl,
      "record type": record.recordType,
      database: this.databaseRef(this.requireDatabase({ identifier: record.databaseId }))
    };
  }

  private databaseRef(database: DatabaseEntity): Record<string, JsonValue> {
    return {
      name: database.name,
      uuid: database.uuid,
      path: database.path
    };
  }

  private groupRef(group: GroupEntity): Record<string, JsonValue> {
    return {
      name: group.name,
      uuid: group.uuid,
      location: group.location,
      path: null,
      "record type": "group"
    };
  }
}

export async function runCli(argv: string[], port = new FakeDevonthinkPort()) {
  const output = new BufferOutput();
  const registry = new CommandRegistry();

  registry.register(new AddCommand());
  registry.register(new DeleteCommand());
  registry.register(new MoveCommand());
  registry.register(new ListCommand());
  registry.register(new SearchCommand());
  registry.register(new IndexCommand());
  registry.register(new PropertyGetCommand());
  registry.register(new PropertySetCommand());
  registry.register(new CreateLocationCommand());
  registry.register(new CreateRecordCommand());
  registry.register(new LookupFileCommand());
  registry.register(new LookupTagsCommand());
  registry.register(new LookupUrlCommand());
  registry.register(new LookupPathCommand());
  registry.register(new AiClassifyCommand());
  registry.register(new AiCompareCommand());
  registry.register(new RecordGetCommand());
  registry.register(new RecordDuplicateCommand());
  registry.register(new RecordReplicateCommand());

  try {
    await registry.run(argv, {
      devonthink: port,
      output,
      schema: devonthinkSchema
    });
    return {
      code: 0,
      stdout: output.stdout.trim(),
      stderr: output.stderr.trim(),
      port
    };
  } catch (error) {
    output.writeError(toErrorMessage(error));
    return {
      code: toExitCode(error),
      stdout: output.stdout.trim(),
      stderr: output.stderr.trim(),
      port
    };
  }
}

export function parseJsonOutput(output: string): JsonValue {
  return JSON.parse(output) as JsonValue;
}

function pickProperties(
  value: Record<string, JsonValue>,
  properties?: string[]
): Record<string, JsonValue> {
  if (!properties || properties.length === 0) {
    return value;
  }

  return properties.reduce<Record<string, JsonValue>>((result, name) => {
    if (Object.prototype.hasOwnProperty.call(value, name)) {
      result[name] = value[name] as JsonValue;
    }
    return result;
  }, {});
}

function applyValues(
  target: Record<string, unknown>,
  values: Record<string, PropertyValue>
): void {
  Object.entries(values).forEach(([key, value]) => {
    if (key === "tags" && Array.isArray(value)) {
      target[key] = value.map((entry) => String(entry));
      return;
    }
    target[key] = value;
  });

  if (typeof target.name === "string" && typeof target.location === "string") {
    target.dtPath = joinLocation(target.location, target.name);
  }
}

function basename(value: string): string {
  const normalized = value.replace(/\/+$/u, "");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || value;
}

function joinLocation(basePath: string, name: string): string {
  if (name.startsWith("/")) {
    return name;
  }

  if (basePath === "/" || basePath === "") {
    return `/${name}`;
  }

  return `${basePath}/${name}`;
}

function matchesSearch(record: RecordEntity, query: string): boolean {
  if (!query) {
    return true;
  }

  const lowerQuery = query.toLowerCase();
  if (lowerQuery.startsWith("name:")) {
    const needle = lowerQuery.slice("name:".length);
    return record.name.toLowerCase().includes(needle);
  }

  if (lowerQuery.startsWith("tags:")) {
    const needle = lowerQuery.slice("tags:".length);
    return record.tags.some((tag) => tag.toLowerCase() === needle);
  }

  return record.name.toLowerCase().includes(lowerQuery);
}

function sharesTag(left: RecordEntity, right: RecordEntity): boolean {
  return left.tags.some((tag) => right.tags.includes(tag));
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isReference(
  value: PropertyValue | undefined
): value is Extract<PropertyValue, { $type: string }> {
  return typeof value === "object" && value !== null && "$type" in value;
}

function isGroupEntity(value: GroupEntity | RecordEntity): value is GroupEntity {
  return !("recordType" in value);
}

function requirePropertyValue(value: PropertyValue | undefined, name: string): PropertyValue {
  if (value === undefined) {
    throw new Error(`Missing required property value: ${name}`);
  }
  return value;
}

function requireFirstRecord(records: RecordEntity[]): RecordEntity {
  const record = records[0];
  if (!record) {
    throw new Error("Expected at least one record.");
  }
  return record;
}

function unreachable(message: string): never {
  throw new Error(message);
}
