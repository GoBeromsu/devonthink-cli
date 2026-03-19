import { describe, expect, it } from "vitest";
import { devonthinkSchema } from "../src/schema/index.js";

describe("DEVONthink schema artifact", () => {
  it("captures application properties that are missing from the default properties bag", () => {
    const applicationProperties = devonthinkSchema.objects.application.properties.map(
      (property) => property.name
    );
    const groupProperties = devonthinkSchema.objects.group.properties.map(
      (property) => property.name
    );
    expect(applicationProperties).toContain("inbox");
    expect(applicationProperties).toContain("incoming group");
    expect(groupProperties).toContain("name");
    expect(groupProperties).toContain("comment");
  });

  it("normalizes command cli names and parameter keys from the scripting dictionary", () => {
    const lookupUrl = devonthinkSchema.commands["lookup records with URL"];
    const searchCommand = devonthinkSchema.commands.search;

    expect(lookupUrl?.cliName).toBe(
      "lookup-records-with-url"
    );
    expect(
      searchCommand?.parameters.find(
        (parameter) => parameter.name === "exclude subgroups"
      )?.key
    ).toBe("excludeSubgroups");
  });
});
