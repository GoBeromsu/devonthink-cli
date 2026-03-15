import { cp, chmod, mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.resolve(root, "dist");
const schemaDir = path.resolve(root, "src/schema");
const distSchemaDir = path.resolve(distDir, "schema");
const sourceRuntimePath = path.resolve(root, "src/adapters/jxa/devonthink.runtime.js");
const distRuntimePath = path.resolve(distDir, "adapters/jxa/devonthink.runtime.js");

await rm(distDir, { recursive: true, force: true });
await run("pnpm", ["exec", "tsc", "-p", "tsconfig.build.json"]);
await mkdir(distSchemaDir, { recursive: true });
await cp(
  path.resolve(schemaDir, "devonthink-schema.json"),
  path.resolve(distSchemaDir, "devonthink-schema.json")
);
await cp(sourceRuntimePath, distRuntimePath);
await chmod(path.resolve(distDir, "cli.js"), 0o755);

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}
