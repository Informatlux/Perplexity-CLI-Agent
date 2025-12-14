import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { getRoot, safePath } from "../config/constants.mjs";
import { c } from "../ui/colors.mjs";
import { getFileIcon } from "../ui/formatting.mjs";
import { readFileQuietly } from "../filesystem/operations.mjs";
import { analyzeProject, collectProjectFiles } from "./analysis.mjs";
import { isConversationalQuery } from "../api/router.mjs";

export async function discoverRelevantFiles(query, settings) {
  // Explicit @filename handling
  const matches = (query.match(/@([\w.\-\/]+)(?:\b|$)/g) || [])
    .map(m => m.slice(1)) // remove @
    .map(f => safePath(f));

  const explicitFiles = [];
  for (const f of matches) {
    try {
      const stats = await fs.stat(f);
      if (stats.isFile()) explicitFiles.push(f);
    } catch (e) { }
  }

  if (explicitFiles.length > 0) {
    if (settings.verbose) console.log(`${c.dim}[Explicit file mention: ${explicitFiles.join(", ")}]${c.reset}`);
    return explicitFiles;
  }

  // Skip file discovery for conversational queries
  if (settings.smartFileDetection && isConversationalQuery(query)) {
    return [];
  }

  const projectType = await analyzeProject();
  const allFiles = await collectProjectFiles(3);
  let relevantFiles = [];
  const queryLower = query.toLowerCase();

  // Check if query needs files at all
  const needsFiles = [
    /what.*do/i, /explain/i, /show/i, /find/i, /search/i,
    /dependenc/i, /import/i, /function/i, /class/i,
    /code/i, /file/i, /implement/i, /how.*work/i,
    /manifest/i, /permission/i, /gradle/i, /build/i
  ];

  if (!needsFiles.some(pattern => pattern.test(queryLower))) {
    if (settings.verbose) console.log(`${c.dim}[Smart detection: No files needed]${c.reset}\n`);
    return [];
  }

  if (projectType === "android") {
    if (queryLower.includes("manifest") || queryLower.includes("permission")) {
      relevantFiles.push(...allFiles.filter(f => f.includes("AndroidManifest.xml")));
    }
    if (queryLower.includes("main") || queryLower.includes("activity") || queryLower.includes("app do") || queryLower.includes("purpose")) {
      relevantFiles.push(...allFiles.filter(f => f.includes("MainActivity") || f.includes("Main")));
    }
    if (queryLower.includes("gradle") || queryLower.includes("dependenc") || queryLower.includes("build")) {
      relevantFiles.push(...allFiles.filter(f => f.includes("build.gradle")));
    }
  }

  if (queryLower.includes("what") || queryLower.includes("about") || queryLower.includes("do")) {
    relevantFiles.push(...allFiles.filter(f => /readme/i.test(f)));
  }

  if (relevantFiles.length === 0 && settings.smartContext) {
    relevantFiles.push(...allFiles.filter(f =>
      f.includes("Main") || f.includes("index") || f.includes("app") ||
      f.includes("build.gradle") || f.includes("AndroidManifest")
    ));
  }

  const maxFiles = settings.maxFilesPerQuery || 8;
  return [...new Set(relevantFiles)].slice(0, maxFiles);
}

export async function traceImports(files) {
  const tracedFiles = new Set();
  const results = [];

  for (const file of files) {
    try {
      const content = await readFileQuietly(file);
      const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith(".")) {
          try {
            const resolved = resolveImportPath(file, importPath);
            if (resolved && !files.includes(resolved) && !tracedFiles.has(resolved)) {
              tracedFiles.add(resolved);
              const fileContent = await readFileQuietly(resolved);
              results.push({
                file: resolved,
                content: fileContent.split("\n").slice(0, 50).join("\n") + "\n... (more)"
              });
            }
          } catch (e) { }
        }
      }
    } catch (e) { }
  }
  
  return results;
}

function resolveImportPath(sourceFile, importPath) {
  const dir = path.dirname(safePath(sourceFile));
  const full = path.resolve(dir, importPath);
  const extensions = ["", ".js", ".mjs", ".ts", ".jsx", ".tsx", ".json"];
  
  for (const ext of extensions) {
    const p = full + ext;
    if (fsExistsSync(p)) return path.relative(getRoot(), p);
  }
  
  return null;
}

function fsExistsSync(filePath) {
  try {
    execSync(`test -e "${filePath}"`, { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync(`if exist "${filePath}" (exit 0) else (exit 1)`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

export async function requestFilePermission(files, rl) {
  console.log(`\n${c.bold}${c.yellow}🔐 Permission Request${c.reset}\n`);
  console.log(`${c.dim}AI wants to read these files:${c.reset}\n`);

  for (let i = 0; i < files.length; i++) {
    const icon = getFileIcon(path.extname(files[i]));
    console.log(`  ${c.gray}${i + 1}.${c.reset} ${icon} ${c.cyan}${files[i]}${c.reset}`);
  }

  console.log();
  const answer = (await rl.question(`${c.yellow}Allow?${c.reset} ${c.dim}(y/n/select)${c.reset}: `)).trim().toLowerCase();

  if (answer === "y" || answer === "yes") return files;
  if (answer === "n" || answer === "no") return [];
  if (answer === "s" || answer === "select") {
    console.log(`${c.dim}Enter numbers (e.g., "1 3 5" or "1-3"):${c.reset}`);
    const selection = (await rl.question(`${c.cyan}Selection:${c.reset} `)).trim();

    const selected = [];
    const parts = selection.split(/[\s,]+/);

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(n => parseInt(n.trim()));
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= files.length) selected.push(files[i - 1]);
        }
      } else {
        const num = parseInt(part);
        if (num >= 1 && num <= files.length) selected.push(files[num - 1]);
      }
    }

    return [...new Set(selected)];
  }

  return [];
}
