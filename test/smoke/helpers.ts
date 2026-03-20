import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const CLI_PATH = path.resolve(PROJECT_ROOT, "src/cli.ts");
const TSX_BIN = path.resolve(PROJECT_ROOT, "node_modules/.bin/tsx");

export const SMOKE_DB = "dt-cli-smoke";

export function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

export function dt(args: string[], timeoutMs = 30_000): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      TSX_BIN,
      [CLI_PATH, ...args],
      {
        cwd: PROJECT_ROOT,
        timeout: timeoutMs,
        env: { ...process.env, NODE_NO_WARNINGS: "1" }
      },
      (error, stdout, stderr) => {
        if (error && typeof (error as NodeJS.ErrnoException).code === "string") {
          // System error (e.g., ENOENT) — not a CLI exit code
          reject(error);
          return;
        }
        const exitCode = error
          ? (error as Error & { code?: number }).code ?? 1
          : 0;
        resolve({
          code: exitCode,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      }
    );
  });
}

export function parseJson(output: string): unknown {
  return JSON.parse(output);
}

export async function createTempFile(
  name: string,
  content = "smoke test content"
): Promise<{ dir: string; file: string }> {
  const dir = await mkdtemp(path.join(tmpdir(), "dt-smoke-"));
  const file = path.join(dir, name);
  await writeFile(file, content, "utf8");
  return { dir, file };
}

export async function cleanupTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}
