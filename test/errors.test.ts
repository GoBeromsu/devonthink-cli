import { describe, expect, it } from "vitest";
import {
  AppError,
  ConflictError,
  ExternalToolError,
  NotFoundError,
  ValidationError,
  toExitCode
} from "../src/application/errors.js";

describe("toExitCode", () => {
  it("maps typed application errors", () => {
    expect(toExitCode(new ValidationError("x"))).toBe(2);
    expect(toExitCode(new NotFoundError("x"))).toBe(3);
    expect(toExitCode(new ConflictError("x"))).toBe(4);
    expect(toExitCode(new ExternalToolError("x"))).toBe(5);
  });

  it("defaults unknown errors to exit code 1", () => {
    expect(toExitCode(new Error("boom"))).toBe(1);
    expect(toExitCode("boom")).toBe(1);
  });

  it("preserves base AppError exit codes", () => {
    expect(toExitCode(new AppError("oops", "X", 99))).toBe(99);
  });
});
