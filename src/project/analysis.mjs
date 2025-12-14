import fs from "node:fs/promises";
import path from "node:path";
import { getRoot, safePath } from "../config/constants.mjs";
import { c } from "../ui/colors.mjs";
import { readFileQuietly } from "../filesystem/operations.mjs";

export async function analyzeProject() {
  try {
    const items = await fs.readdir(getRoot());
    if (items.includes("build.gradle") || items.includes("build.gradle.kts")) {
      return items.includes("app") ? "android" : "gradle";
    }
    if (items.includes("package.json")) return "javascript";
    if (items.includes("pom.xml")) return "java-maven";
    if (items.includes("requirements.txt")) return "python";
    if (items.includes("Cargo.toml")) return "rust";
    if (items.includes("go.mod")) return "go";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export async function collectProjectFiles(maxDepth = 2) {
  const files = [];
  const importantPatterns = [
    /README|\.md$/i,
    /package\.json|build\.gradle|settings\.gradle|AndroidManifest\.xml$/i,
    /\.(kt|java|js|ts|py|rs|go)$/i
  ];

  async function scan(dir, depth = 0) {
    if (depth > maxDepth) return;
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith(".")) continue;
        const full = path.join(dir, item.name);
        const rel = path.relative(getRoot(), full);

        if (item.isDirectory()) {
          const skipDirs = ["node_modules", ".git", "build", "dist", ".gradle", "__pycache__", "target", ".venv"];
          if (!skipDirs.includes(item.name)) {
            await scan(full, depth + 1);
          }
        } else {
          if (importantPatterns.some(p => p.test(item.name))) {
            files.push(rel);
          }
        }
      }
    } catch (e) { }
  }

  await scan(getRoot());
  return files;
}

export async function grepProject(pattern) {
  const files = await collectProjectFiles(4);
  const regex = new RegExp(pattern, "i");
  const matches = [];

  for (const f of files) {
    try {
      const content = await readFileQuietly(f);
      const lines = content.split("\n");
      lines.forEach((line, i) => {
        if (regex.test(line)) {
          matches.push({ file: f, line: i + 1, content: line.trim() });
        }
      });
    } catch (e) { }
  }
  
  return matches;
}

export async function scanTodos() {
  return await grepProject("(TODO|FIXME|BUG|HACK):?");
}

export async function analyzeDeps() {
  const pkgPath = path.join(getRoot(), "package.json");
  try {
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
    return {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {}
    };
  } catch {
    return null;
  }
}
