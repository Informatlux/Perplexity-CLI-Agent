import fs from "node:fs/promises";
import path from "node:path";
import { safePath } from "../config/constants.mjs";
import { c } from "../ui/colors.mjs";
import { getFileIcon } from "../ui/formatting.mjs";

export async function treeDir(rel = ".", depth = 0, maxDepth = 3) {
  if (depth === 0) {
    console.log(`${c.bold}${c.brightCyan}🌳 ${path.basename(safePath(rel))}${c.reset}\n`);
  }

  if (depth > maxDepth) return;

  const dir = safePath(rel);
  const items = await fs.readdir(dir, { withFileTypes: true });
  const prefix = "  ".repeat(depth);

  for (const item of items) {
    if (item.name.startsWith(".")) continue;
    const icon = item.isDirectory() ? "📂" : getFileIcon(path.extname(item.name));

    if (item.isDirectory()) {
      console.log(`${prefix}${c.blue}├─ ${icon} ${item.name}/${c.reset}`);
      await treeDir(path.join(rel, item.name), depth + 1, maxDepth);
    } else {
      console.log(`${prefix}├─ ${icon} ${item.name}`);
    }
  }

  if (depth === 0) console.log();
}

export async function find(pattern, rel = ".") {
  const dir = safePath(rel);
  const regex = new RegExp(pattern, "i");
  const matches = [];

  async function search(currentDir, currentRel) {
    const items = await fs.readdir(currentDir, { withFileTypes: true });
    for (const item of items) {
      if (item.name.startsWith(".")) continue;
      const itemPath = path.join(currentDir, item.name);
      const itemRel = path.join(currentRel, item.name);

      if (regex.test(item.name)) {
        matches.push({ path: itemRel, isDir: item.isDirectory() });
      }

      if (item.isDirectory()) {
        try {
          await search(itemPath, itemRel);
        } catch (e) { }
      }
    }
  }

  await search(dir, rel);

  if (matches.length === 0) {
    console.log(`${c.yellow}⚠${c.reset} No matches for ${c.cyan}"${pattern}"${c.reset}\n`);
  } else {
    console.log(`${c.green}✓${c.reset} Found ${c.yellow}${matches.length}${c.reset} match${matches.length > 1 ? 'es' : ''}:\n`);
    for (const match of matches) {
      const icon = match.isDir ? "📂" : getFileIcon(path.extname(match.path));
      console.log(`  ${icon} ${c.cyan}${match.path}${c.reset}`);
    }
    console.log();
  }
  
  return matches;
}
