#!/usr/bin/env -S node --import tsx/esm

import { createRuntime } from "./compositionRoot.js";
import { toErrorMessage, toExitCode } from "./application/errors.js";

export async function runCli(argv: string[]): Promise<void> {
  const runtime = createRuntime();
  await runtime.registry.run(argv, runtime);
}

runCli(process.argv.slice(2)).catch((error) => {
  const runtime = createRuntime();
  runtime.output.writeError(toErrorMessage(error));
  process.exit(toExitCode(error));
});
