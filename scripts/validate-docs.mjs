import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.resolve(root, "docs");

const errors = [];

// --- 1. Parse docs/index.md tree block and verify files exist on disk ---

const indexContent = await readFile(path.resolve(docsDir, "index.md"), "utf8");
const treeMatch = indexContent.match(/```text\n([\s\S]*?)```/);
if (!treeMatch) {
  errors.push("docs/index.md: no ```text tree block found");
} else {
  const treeFiles = parseTree(treeMatch[1]);

  // Check every listed file exists
  for (const rel of treeFiles) {
    const abs = path.resolve(docsDir, rel);
    if (!(await exists(abs))) {
      errors.push(`docs/index.md tree lists "${rel}" but file does not exist`);
    }
  }

  // Check every file under docs/ is listed in the tree
  const actualFiles = await walkDir(docsDir, docsDir);
  for (const rel of actualFiles) {
    if (rel === "index.md") continue; // index.md itself is the root, not listed in its own tree
    if (!treeFiles.includes(rel)) {
      errors.push(`"docs/${rel}" exists on disk but is not listed in docs/index.md tree`);
    }
  }
}

// --- 2. Validate markdown links in AGENTS.md ---

await validateLinks(path.resolve(root, "AGENTS.md"), root);

// --- 3. Validate markdown links in each subdirectory index.md ---

const subIndexes = [
  "docs/design-docs/index.md",
  "docs/product-specs/index.md",
  "docs/generated/index.md",
  "docs/references/index.md",
];

for (const rel of subIndexes) {
  const abs = path.resolve(root, rel);
  if (await exists(abs)) {
    await validateLinks(abs, path.dirname(abs));
  }
}

// --- Report ---

if (errors.length > 0) {
  console.error("validate-docs: FAILED\n");
  for (const e of errors) {
    console.error(`  ✗ ${e}`);
  }
  console.error(`\n${errors.length} error(s)`);
  process.exit(1);
} else {
  console.log("validate-docs: OK");
}

// --- Helpers ---

/**
 * Parse a tree-style text block into relative file paths.
 * Handles lines like: │   ├── core-beliefs.md
 * Tracks directory context from lines ending with /
 */
function parseTree(treeText) {
  const files = [];
  const lines = treeText.split("\n").filter((l) => l.trim());
  const dirStack = [];

  for (const line of lines) {
    // Extract the file/dir name after tree chars (├── └── │ etc.)
    const match = line.match(/^([│\s├└─┬]*)\s*(.+)$/);
    if (!match) continue;

    const prefix = match[1];
    const name = match[2].trim();
    if (!name) continue;

    // Calculate depth from prefix (count segments of "│   " or "    ")
    // Each level is 4 characters wide (including the tree chars)
    const depth = Math.floor(prefix.replace(/─/g, "").replace(/[├└┬]/g, "│").length / 4);

    // Trim dirStack to current depth
    dirStack.length = depth;

    if (name.endsWith("/")) {
      // It's a directory
      dirStack.push(name);
    } else {
      // It's a file
      const filePath = [...dirStack, name].join("");
      files.push(filePath);
    }
  }

  return files;
}

/**
 * Recursively walk a directory and return relative file paths.
 */
async function walkDir(dir, base) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkDir(full, base)));
    } else {
      results.push(path.relative(base, full));
    }
  }
  return results;
}

/**
 * Extract markdown links from a file and verify targets exist.
 * Only checks relative links (not URLs).
 */
async function validateLinks(filePath, resolveBase) {
  const content = await readFile(filePath, "utf8");
  const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
  const rel = path.relative(root, filePath);

  let match;
  while ((match = linkRe.exec(content)) !== null) {
    const target = match[2];
    // Skip URLs and anchors
    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#")) {
      continue;
    }
    const abs = path.resolve(resolveBase, target);
    if (!(await exists(abs))) {
      errors.push(`${rel}: link "${target}" points to non-existent file`);
    }
  }
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
