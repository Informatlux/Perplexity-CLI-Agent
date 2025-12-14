import fs from "node:fs/promises";
import path from "node:path";
import { safePath, BACKUP_DIR } from "../config/constants.mjs";
import { c } from "../ui/colors.mjs";
import { highlightSyntax, formatSize, getFileIcon } from "../ui/formatting.mjs";

export async function readFile(rel, settings) {
  const full = safePath(rel);
  const content = await fs.readFile(full, "utf8");
  const lines = content.split("\n");
  const stats = await fs.stat(full);

  console.log(`${c.bold}${c.brightCyan}📄 ${rel}${c.reset}${c.dim} · ${lines.length} lines · ${formatSize(stats.size)}${c.reset}\n`);

  lines.forEach((line, i) => {
    const lineNum = String(i + 1).padStart(4, " ");
    console.log(`${c.gray}${lineNum}${c.reset} ${highlightSyntax(line, settings)}`);
  });
  console.log();
  return content;
}

export async function readFileQuietly(rel) {
  const full = safePath(rel);
  return await fs.readFile(full, "utf8");
}

export async function writeFile(rel, content) {
  const full = safePath(rel);

  // Backup if exists
  try {
    const stats = await fs.stat(full);
    if (stats.isFile()) {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `${path.basename(rel)}.${timestamp}.bak`;
      await fs.copyFile(full, path.join(BACKUP_DIR, backupName));
    }
  } catch (e) { }

  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf8");
}

export async function restoreBackup() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    if (files.length === 0) {
      console.log(`${c.yellow}⚠ No backups found${c.reset}\n`);
      return null;
    }

    files.sort((a, b) => b.localeCompare(a));
    const latest = files[0];
    const originalName = latest.replace(/\.\d{4}-\d{2}-\d{2}T.*\.bak$/, "");
    const backupPath = path.join(BACKUP_DIR, latest);

    return { name: originalName, backup: backupPath, time: latest };
  } catch {
    return null;
  }
}

export async function listDir(rel = ".", settings) {
  const dir = safePath(rel);
  const items = await fs.readdir(dir, { withFileTypes: true });

  if (items.length === 0) {
    console.log(`${c.gray}(empty directory)${c.reset}\n`);
    return;
  }

  console.log(`${c.bold}${c.brightCyan}📁 ${path.basename(dir)}${c.reset}${c.dim} · ${items.length} items${c.reset}\n`);

  const dirs = items.filter(it => it.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  const files = items.filter(it => !it.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));

  for (const it of dirs) {
    console.log(`  ${c.blue}📂 ${it.name}/${c.reset}`);
  }

  for (const it of files) {
    const full = path.join(dir, it.name);
    const stats = await fs.stat(full);
    const size = formatSize(stats.size);
    const ext = path.extname(it.name);
    const icon = getFileIcon(ext);
    console.log(`  ${icon} ${c.white}${it.name}${c.reset} ${c.dim}${size}${c.reset}`);
  }
  console.log();
}

export async function mkdir(rel) {
  const full = safePath(rel);
  await fs.mkdir(full, { recursive: true });
  console.log(`${c.green}✓${c.reset} Created ${c.cyan}${rel}${c.reset}\n`);
}

export async function rm(rel) {
  const full = safePath(rel);
  const stats = await fs.stat(full);
  if (stats.isDirectory()) {
    await fs.rm(full, { recursive: true, force: true });
  } else {
    await fs.unlink(full);
  }
  console.log(`${c.green}✓${c.reset} Deleted ${c.cyan}${rel}${c.reset}\n`);
}

export async function cp(src, dest) {
  const fullSrc = safePath(src);
  const fullDest = safePath(dest);
  const stats = await fs.stat(fullSrc);

  if (stats.isDirectory()) {
    await copyDir(fullSrc, fullDest);
  } else {
    await fs.mkdir(path.dirname(fullDest), { recursive: true });
    await fs.copyFile(fullSrc, fullDest);
  }
  console.log(`${c.green}✓${c.reset} Copied ${c.cyan}${src}${c.reset} → ${c.cyan}${dest}${c.reset}\n`);
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const items = await fs.readdir(src, { withFileTypes: true });
  for (const item of items) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    if (item.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function mv(src, dest) {
  const fullSrc = safePath(src);
  const fullDest = safePath(dest);
  await fs.rename(fullSrc, fullDest);
  console.log(`${c.green}✓${c.reset} Moved ${c.cyan}${src}${c.reset} → ${c.cyan}${dest}${c.reset}\n`);
}

export async function stat(rel) {
  const full = safePath(rel);
  const stats = await fs.stat(full);
  const isDir = stats.isDirectory();

  console.log(`
${c.bold}${c.brightCyan}${isDir ? '📂' : '📄'} ${rel}${c.reset}

${c.dim}Type:${c.reset}        ${isDir ? "Directory" : "File"}
${c.dim}Size:${c.reset}        ${formatSize(stats.size)} ${c.dim}(${stats.size.toLocaleString()} bytes)${c.reset}
${c.dim}Modified:${c.reset}    ${new Date(stats.mtime).toLocaleString()}
${c.dim}Created:${c.reset}     ${new Date(stats.birthtime).toLocaleString()}
  `);
}
