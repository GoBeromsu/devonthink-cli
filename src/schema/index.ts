import schemaJson from "./devonthink-schema.json" with { type: "json" };
import type { DevonthinkSchema } from "../application/types.js";

export const devonthinkSchema = schemaJson as DevonthinkSchema;
