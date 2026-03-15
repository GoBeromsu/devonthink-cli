import { spawn } from "node:child_process";

export interface ProcessRunOptions {
  cwd?: string;
  input?: string;
}

export interface ProcessRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ProcessRunner {
  run(
    command: string,
    args: string[],
    options?: ProcessRunOptions
  ): Promise<ProcessRunResult>;
}

export class NodeProcessRunner implements ProcessRunner {
  async run(
    command: string,
    args: string[],
    options: ProcessRunOptions = {}
  ): Promise<ProcessRunResult> {
    return await new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        stdio: "pipe"
      });

      let stdout = "";
      let stderr = "";

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");

      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });

      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("close", (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1
        });
      });

      if (options.input) {
        child.stdin.write(options.input);
      }

      child.stdin.end();
    });
  }
}
