import { fileURLToPath } from "node:url";
import type {
  DatabaseGetInput,
  DatabaseSetInput,
  DevonthinkPort,
  GroupGetInput,
  GroupListInput,
  GroupSetInput,
  PropertyReadInput,
  RecordGetInput,
  RecordSetInput
} from "../../application/ports.js";
import {
  ExternalToolError,
  NotFoundError,
  ValidationError
} from "../../application/errors.js";
import type {
  DevonthinkCommandInput,
  DevonthinkSchema,
  JsonValue,
  SchemaObjectKind,
  SchemaProperty
} from "../../application/types.js";
import type { ProcessRunner } from "../../infrastructure/processRunner.js";

interface JxaErrorPayload {
  code: string;
  message: string;
  name: string;
}

interface JxaResponse<T> {
  ok: boolean;
  result?: T;
  error?: JxaErrorPayload;
}

interface PropertyRequestPayload {
  objectKind: SchemaObjectKind;
  propertySpecs: SchemaProperty[];
  selectedProperties: string[] | null;
}

export class JxaDevonthinkAdapter implements DevonthinkPort {
  private readonly runtimePath = fileURLToPath(
    new URL("./devonthink.runtime.js", import.meta.url)
  );

  constructor(
    private readonly runner: ProcessRunner,
    private readonly schema: DevonthinkSchema
  ) {}

  async getApplication(input: PropertyReadInput): Promise<JsonValue> {
    return await this.execute("getApplication", {
      propertyRequest: this.propertyRequest("application", input.properties),
      schemaObjects: this.schema.objects
    });
  }

  async listDatabases(input: PropertyReadInput): Promise<JsonValue[]> {
    return await this.execute("listDatabases", {
      propertyRequest: this.propertyRequest("database", input.properties),
      schemaObjects: this.schema.objects
    });
  }

  async getDatabase(input: DatabaseGetInput): Promise<JsonValue> {
    return await this.execute("getDatabase", {
      locator: input.locator,
      propertyRequest: this.propertyRequest("database", input.properties),
      schemaObjects: this.schema.objects
    });
  }

  async setDatabase(input: DatabaseSetInput): Promise<JsonValue> {
    return await this.execute("setDatabase", {
      locator: input.locator,
      values: input.values,
      propertyRequest: this.propertyRequest("database", input.properties),
      schemaObjects: this.schema.objects
    });
  }

  async listGroups(input: GroupListInput): Promise<JsonValue[]> {
    return await this.execute("listGroups", {
      locator: input.locator,
      propertyRequest: this.propertyRequest("group", input.properties),
      schemaObjects: this.schema.objects
    });
  }

  async getGroup(input: GroupGetInput): Promise<JsonValue> {
    return await this.execute("getGroup", {
      locator: input.locator,
      propertyRequest: this.propertyRequest("group", input.properties),
      schemaObjects: this.schema.objects
    });
  }

  async setGroup(input: GroupSetInput): Promise<JsonValue> {
    return await this.execute("setGroup", {
      locator: input.locator,
      values: input.values,
      propertyRequest: this.propertyRequest("group", input.properties),
      schemaObjects: this.schema.objects
    });
  }

  async getRecord(input: RecordGetInput): Promise<JsonValue> {
    return await this.execute("getRecord", {
      locator: input.locator,
      propertyRequest: this.propertyRequest("record", input.properties),
      schemaObjects: this.schema.objects
    });
  }

  async setRecord(input: RecordSetInput): Promise<JsonValue> {
    return await this.execute("setRecord", {
      locator: input.locator,
      values: input.values,
      propertyRequest: this.propertyRequest("record", input.properties),
      schemaObjects: this.schema.objects
    });
  }

  async invokeCommand(input: DevonthinkCommandInput): Promise<JsonValue> {
    const schemaCommand = this.schema.commands[input.commandName];

    if (!schemaCommand) {
      throw new ValidationError(`Unsupported DEVONthink command: ${input.commandName}`);
    }

    return await this.execute("invokeCommand", {
      commandName: input.commandName,
      methodName: schemaCommand.methodName,
      directValue: input.directValue,
      parameters: input.parameters,
      schemaObjects: this.schema.objects
    });
  }

  private propertyRequest(
    kind: SchemaObjectKind,
    selectedProperties?: string[]
  ): PropertyRequestPayload {
    return {
      objectKind: kind,
      propertySpecs: this.schema.objects[kind].properties,
      selectedProperties:
        selectedProperties && selectedProperties.length > 0 ? selectedProperties : null
    };
  }

  private async execute<T>(operation: string, input: unknown): Promise<T> {
    const result = await this.runner.run("osascript", [
      "-l",
      "JavaScript",
      this.runtimePath,
      JSON.stringify({ operation, input })
    ]);

    if (result.exitCode !== 0) {
      throw new ExternalToolError(
        `DEVONthink command failed: ${result.stderr.trim() || result.stdout.trim()}`
      );
    }

    const output = extractStructuredOutput(result.stdout, result.stderr);
    let payload: JxaResponse<T>;

    try {
      payload = JSON.parse(output) as JxaResponse<T>;
    } catch (error) {
      throw new ExternalToolError(
        `Failed to parse DEVONthink response: ${String(error)}. stdout=${result.stdout.trim() || "(empty)"}, stderr=${result.stderr.trim() || "(empty)"}`
      );
    }

    if (!payload.ok) {
      throw this.mapError(payload.error);
    }

    return payload.result as T;
  }

  private mapError(error?: JxaErrorPayload): Error {
    if (!error) {
      return new ExternalToolError("Unknown DEVONthink error.");
    }

    if (error.code === "NOT_FOUND") {
      return new NotFoundError(error.message);
    }

    if (error.code === "VALIDATION_ERROR") {
      return new ValidationError(error.message);
    }

    return new ExternalToolError(error.message);
  }
}

function extractStructuredOutput(stdout: string, stderr: string): string {
  const candidates = [stdout, stderr]
    .flatMap((stream) =>
      stream
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter(Boolean)
    )
    .reverse();

  return candidates.find((line) => line.startsWith("{") || line.startsWith("[")) ?? "";
}
