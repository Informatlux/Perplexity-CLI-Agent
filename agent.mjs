import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { exec, execSync } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// ANSI Colors
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", cyan: "\x1b[36m", magenta: "\x1b[35m",
  gray: "\x1b[90m", white: "\x1b[37m",
  brightCyan: "\x1b[96m", brightMagenta: "\x1b[95m", brightYellow: "\x1b[93m"
};

const KEY = process.env.PPLX_API_KEY;
if (!KEY) {
  console.error(`${c.red}✗ Missing PPLX_API_KEY${c.reset}\nSet it: export PPLX_API_KEY=your_key\n`);
  process.exit(1);
}

let ROOT = path.resolve(process.argv[2] ?? process.cwd());
const SETTINGS_FILE = path.join(process.cwd(), "pplx-settings.json");
const SESSION_DIR = path.join(process.cwd(), ".pplx-sessions");
const SNIPPETS_FILE = path.join(process.cwd(), "pplx-snippets.json");

// Load settings
async function loadSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {
      model: "sonar-pro",
      temperature: 0.2,
      editTemp: 0.2,
      maxHistory: 10,
      autoContext: true,
      syntax: true,
      askPermission: true,
      autoSuggest: true,
      gitIntegration: true,
      conversationalMode: false,
      smartFileDetection: true,
      maxFilesPerQuery: 8,
      showFilePreview: true,
      autoSave: false,
      colorScheme: "vibrant",
      verbose: false,
      compactMode: false,
      showTimestamps: false,
      autoCommit: false,
      autoFormat: true,
      cacheResponses: false,
      streamingMode: false,
      debugMode: false,
      quietMode: false,
      smartContext: true,
      deepAnalysis: false
    };
  }
}

let settings = await loadSettings();
let conversationHistory = [];
let projectContext = null;
let snippetsLibrary = {};
let lastCommand = "";

// Load snippets
try {
  const data = await fs.readFile(SNIPPETS_FILE, "utf8");
  snippetsLibrary = JSON.parse(data);
} catch {
  snippetsLibrary = {};
}

let MODEL = settings.model;

// Spinner
let spinnerInterval = null;
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerFrame = 0;

function startSpinner(text = "Thinking") {
  spinnerFrame = 0;
  spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${c.cyan}${spinnerFrames[spinnerFrame]} ${text}...${c.reset}`);
    spinnerFrame = (spinnerFrame + 1) % spinnerFrames.length;
  }, 80);
}

function stopSpinner() {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
  }
}

async function saveSettings() {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
}

async function saveSnippets() {
  await fs.writeFile(SNIPPETS_FILE, JSON.stringify(snippetsLibrary, null, 2), "utf8");
}

function safePath(p) {
  const full = path.resolve(ROOT, p);
  if (!full.startsWith(ROOT + path.sep) && full !== ROOT) {
    throw new Error(`Blocked path (outside ROOT): ${p}`);
  }
  return full;
}

async function pplx(messages, { temperature = undefined } = {}) {
  const temp = temperature ?? settings.temperature;
  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: temp })
  });
  
  const j = await r.json();
  if (!r.ok) {
    throw new Error(`API Error: ${j?.error?.message ?? "Unknown error"}`);
  }
  const text = j?.choices?.[0]?.message?.content ?? JSON.stringify(j);
  return { text, raw: j };
}

// Git helpers
function isGitRepo() {
  try {
    execSync("git rev-parse --git-dir", { cwd: ROOT, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getGitStatus() {
  try {
    return execSync("git status --short", { cwd: ROOT, encoding: "utf8" });
  } catch {
    return "";
  }
}

function getGitDiff() {
  try {
    return execSync("git diff", { cwd: ROOT, encoding: "utf8", maxBuffer: 1024 * 1024 * 5 });
  } catch {
    return "";
  }
}

function getGitLog(count = 5) {
  try {
    return execSync(`git log -${count} --pretty=format:"%h - %s (%cr) <%an>"`, { 
      cwd: ROOT, 
      encoding: "utf8" 
    });
  } catch {
    return "";
  }
}

function getFileIcon(ext) {
  const icons = {
    '.js': '📜', '.mjs': '📜', '.ts': '📘', '.tsx': '📘',
    '.jsx': '⚛️', '.json': '📋', '.md': '📝', '.txt': '📄',
    '.py': '🐍', '.java': '☕', '.kt': '🎯', '.xml': '📰',
    '.html': '🌐', '.css': '🎨', '.png': '🖼️', '.jpg': '🖼️',
    '.gif': '🖼️', '.svg': '🎨', '.pdf': '📕', '.zip': '📦',
    '.gradle': '🐘', '.properties': '⚙️', '.yml': '⚙️'
  };
  return icons[ext.toLowerCase()] || '📄';
}

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function highlightSyntax(line) {
  if (!settings.syntax) return line;
  line = line.replace(/\b(function|const|let|var|class|async|await|import|export|return|if|else|for|while|try|catch|throw|new|public|private|protected|override|fun|val)\b/g, `${c.magenta}$1${c.reset}`);
  line = line.replace(/\b(true|false|null|undefined)\b/g, `${c.blue}$1${c.reset}`);
  line = line.replace(/(['"])(.*?)\1/g, `${c.green}$1$2$1${c.reset}`);
  line = line.replace(/\/\/.*$/g, `${c.gray}$&${c.reset}`);
  return line;
}

async function readFile(rel) {
  const full = safePath(rel);
  const content = await fs.readFile(full, "utf8");
  const lines = content.split("\n");
  const stats = await fs.stat(full);

  console.log(`${c.bold}${c.brightCyan}📄 ${rel}${c.reset}${c.dim} · ${lines.length} lines · ${formatSize(stats.size)}${c.reset}\n`);
  
  lines.forEach((line, i) => {
    const lineNum = String(i + 1).padStart(4, " ");
    console.log(`${c.gray}${lineNum}${c.reset} ${highlightSyntax(line)}`);
  });
  console.log();
  return content;
}

async function readFileQuietly(rel) {
  const full = safePath(rel);
  return await fs.readFile(full, "utf8");
}

async function writeFile(rel, content) {
  const full = safePath(rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf8");
}

async function listDir(rel = ".") {
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

async function mkdir(rel) {
  const full = safePath(rel);
  await fs.mkdir(full, { recursive: true });
  console.log(`${c.green}✓${c.reset} Created ${c.cyan}${rel}${c.reset}\n`);
}

async function rm(rel) {
  const full = safePath(rel);
  const stats = await fs.stat(full);
  if (stats.isDirectory()) {
    await fs.rm(full, { recursive: true, force: true });
  } else {
    await fs.unlink(full);
  }
  console.log(`${c.green}✓${c.reset} Deleted ${c.cyan}${rel}${c.reset}\n`);
}

async function cp(src, dest) {
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

async function mv(src, dest) {
  const fullSrc = safePath(src);
  const fullDest = safePath(dest);
  await fs.rename(fullSrc, fullDest);
  console.log(`${c.green}✓${c.reset} Moved ${c.cyan}${src}${c.reset} → ${c.cyan}${dest}${c.reset}\n`);
}

async function treeDir(rel = ".", depth = 0, maxDepth = 3) {
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

async function find(pattern, rel = ".") {
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
        } catch (e) {}
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

async function stat(rel) {
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

// Project analysis
async function analyzeProject() {
  try {
    const items = await fs.readdir(ROOT);
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

async function collectProjectFiles(maxDepth = 2) {
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
        const rel = path.relative(ROOT, full);

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
    } catch (e) {}
  }

  await scan(ROOT);
  return files;
}

// Check if query is just conversational (no need for files)
function isConversationalQuery(query) {
  const conversational = [
    /^(hi|hello|hey|yo|sup|wassup)$/i,
    /^(thanks|thank you|thx|ty)$/i,
    /^(ok|okay|cool|nice|awesome|great)$/i,
    /^(bye|goodbye|see you|later)$/i,
    /^(yes|no|yep|nope|yeah|nah)$/i,
    /^(lol|lmao|haha|😂|👍)$/i,
    /^(oh|hmm|uh|ah|wow)$/i,
  ];
  
  const queryLower = query.toLowerCase().trim();
  
  // Check if it's just a short conversational response
  if (queryLower.length < 15 && conversational.some(r => r.test(queryLower))) {
    return true;
  }
  
  // Check if it's a simple acknowledgment with "bro", "man", etc.
  if (/^(ok|cool|nice|thanks|alright)\s+(bro|man|dude|mate)/i.test(queryLower)) {
    return true;
  }
  
  return false;
}

async function discoverRelevantFiles(query) {
  // Skip file discovery for conversational queries
  if (settings.smartFileDetection && isConversationalQuery(query)) {
    return [];
  }
  
  const projectType = await analyzeProject();
  const allFiles = await collectProjectFiles(3);
  const relevantFiles = [];
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

async function requestFilePermission(files, rl) {
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

function formatResponse(text) {
  let output = text;
  output = output.replace(/^### (.*?)$/gm, `\n${c.bold}${c.brightMagenta}▸ $1${c.reset}`);
  output = output.replace(/^## (.*?)$/gm, `\n${c.bold}${c.brightCyan}▸▸ $1${c.reset}`);
  output = output.replace(/^# (.*?)$/gm, `\n${c.bold}${c.blue}▸▸▸ $1${c.reset}`);
  output = output.replace(/\*\*(.*?)\*\*/g, `${c.bold}$1${c.reset}`);
  output = output.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `\n${c.dim}┌─ ${lang || 'code'} ─┐${c.reset}\n${c.gray}${code}${c.reset}${c.dim}└──────┘${c.reset}\n`;
  });
  output = output.replace(/`([^`]+)`/g, `${c.yellow}$1${c.reset}`);
  output = output.replace(/^\- (.*?)$/gm, `${c.cyan}  •${c.reset} $1`);
  output = output.replace(/^\* (.*?)$/gm, `${c.cyan}  •${c.reset} $1`);
  output = output.replace(/^\d+\. (.*?)$/gm, `${c.cyan}  ▸${c.reset} $1`);
  return output;
}

// Advanced features
async function reviewCode(file) {
  const content = await readFileQuietly(file);
  const sys = "You are a senior code reviewer. Analyze for: bugs, performance issues, security vulnerabilities, best practices, and improvements. Provide a structured review.";
  const user = `Review:\n\nFile: ${file}\n\n${content}`;
  
  startSpinner("Reviewing code");
  const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }]);
  stopSpinner();
  
  console.log(`\n${c.bold}${c.brightMagenta}🔍 Code Review: ${file}${c.reset}\n`);
  console.log(formatResponse(text));
  console.log();
}

async function generateTests(file) {
  const content = await readFileQuietly(file);
  const projectType = await analyzeProject();
  let framework = "Jest";
  if (projectType === "python") framework = "pytest";
  if (projectType === "java" || projectType === "android") framework = "JUnit";
  
  const sys = `Generate comprehensive unit tests using ${framework}. Include setup/teardown, positive/negative cases, edge cases, mocks. Return ONLY test code.`;
  const user = `Generate tests:\n\n${content}`;
  
  startSpinner("Generating tests");
  const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: 0.2 });
  stopSpinner();
  
  return text;
}

async function generateDocs(file) {
  const content = await readFileQuietly(file);
  const sys = "Generate comprehensive documentation with: overview, functions/classes, parameters, usage examples, return values. Return ONLY documented code.";
  const user = `Document:\n\n${content}`;
  
  startSpinner("Generating docs");
  const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: 0.3 });
  stopSpinner();
  
  return text;
}

async function generateCommitMessage() {
  if (!isGitRepo()) {
    console.log(`${c.red}✗${c.reset} Not a git repository\n`);
    return;
  }
  
  const diff = getGitDiff();
  if (!diff) {
    console.log(`${c.yellow}⚠${c.reset} No changes to commit\n`);
    return;
  }
  
  const sys = "Generate a concise conventional commit message. Format: <type>(<scope>): <description>. Types: feat, fix, docs, style, refactor, test, chore. Keep under 72 chars.";
  const user = `Generate commit message:\n\n${diff.slice(0, 3000)}`;
  
  startSpinner("Generating commit");
  const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: 0.3 });
  stopSpinner();
  
  console.log(`\n${c.bold}${c.brightCyan}📝 Suggested Commit:${c.reset}\n`);
  console.log(`${c.green}${text.trim()}${c.reset}\n`);
}

async function codeMetrics(file) {
  const content = await readFileQuietly(file);
  const lines = content.split('\n');
  
  const totalLines = lines.length;
  const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
  const commentLines = lines.filter(l => l.trim().startsWith('//')).length;
  const blankLines = lines.filter(l => !l.trim()).length;
  
  console.log(`\n${c.bold}${c.brightCyan}📊 Code Metrics: ${file}${c.reset}\n`);
  console.log(`${c.dim}Total Lines:${c.reset}    ${c.yellow}${totalLines}${c.reset}`);
  console.log(`${c.dim}Code Lines:${c.reset}     ${c.green}${codeLines}${c.reset}`);
  console.log(`${c.dim}Comments:${c.reset}       ${c.blue}${commentLines}${c.reset}`);
  console.log(`${c.dim}Blank Lines:${c.reset}    ${c.gray}${blankLines}${c.reset}`);
  console.log(`${c.dim}Code/Comment:${c.reset}   ${c.yellow}${(codeLines / Math.max(commentLines, 1)).toFixed(2)}${c.reset}\n`);
}

async function scaffold(type, name) {
  const projectType = await analyzeProject();
  let template = "";
  let filename = "";
  
  if (projectType === "android" && type === "activity") {
    filename = `${name}Activity.kt`;
    template = `package com.example.app\n\nimport android.os.Bundle\nimport androidx.appcompat.app.AppCompatActivity\n\nclass ${name}Activity : AppCompatActivity() {\n    override fun onCreate(savedInstanceState: Bundle?) {\n        super.onCreate(savedInstanceState)\n        // TODO: Set content view\n    }\n}`;
  } else if (projectType === "javascript" && type === "component") {
    filename = `${name}.jsx`;
    template = `import React from 'react';\n\nconst ${name} = () => {\n  return (\n    <div>\n      <h1>${name}</h1>\n    </div>\n  );\n};\n\nexport default ${name};`;
  } else {
    const sys = `Generate a ${type} template named ${name} for ${projectType}. Return ONLY code.`;
    const user = `Create ${type}: ${name}`;
    
    startSpinner("Generating");
    const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }]);
    stopSpinner();
    
    template = text;
    filename = `${name}.${projectType === 'python' ? 'py' : projectType === 'java' ? 'java' : 'js'}`;
  }
  
  console.log(`\n${c.bold}${c.yellow}━━ ${filename} ━━${c.reset}\n`);
  console.log(template);
  console.log(`\n${c.bold}${c.yellow}━━━━━━━━━━━━${c.reset}\n`);
  
  return { filename, content: template };
}

// Session management
async function saveSession(name) {
  await fs.mkdir(SESSION_DIR, { recursive: true });
  const sessionFile = path.join(SESSION_DIR, `${name}.json`);
  
  const session = {
    timestamp: new Date().toISOString(),
    root: ROOT,
    history: conversationHistory,
    settings: settings
  };
  
  await fs.writeFile(sessionFile, JSON.stringify(session, null, 2), "utf8");
  console.log(`${c.green}✓${c.reset} Session saved: ${c.cyan}${name}${c.reset}\n`);
}

async function loadSession(name) {
  const sessionFile = path.join(SESSION_DIR, `${name}.json`);
  
  try {
    const data = await fs.readFile(sessionFile, "utf8");
    const session = JSON.parse(data);
    
    conversationHistory = session.history || [];
    ROOT = session.root || ROOT;
    
    console.log(`${c.green}✓${c.reset} Loaded: ${c.cyan}${name}${c.reset}`);
    console.log(`${c.dim}Time: ${new Date(session.timestamp).toLocaleString()}${c.reset}`);
    console.log(`${c.dim}Messages: ${conversationHistory.length}${c.reset}\n`);
  } catch (e) {
    console.log(`${c.red}✗${c.reset} Session not found: ${name}\n`);
  }
}

async function listSessions() {
  try {
    await fs.mkdir(SESSION_DIR, { recursive: true });
    const files = await fs.readdir(SESSION_DIR);
    
    if (files.length === 0) {
      console.log(`${c.yellow}⚠${c.reset} No saved sessions\n`);
      return;
    }
    
    console.log(`${c.bold}${c.brightCyan}💾 Saved Sessions${c.reset}\n`);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(SESSION_DIR, file), "utf8");
        const session = JSON.parse(data);
        const name = file.replace('.json', '');
        console.log(`  ${c.cyan}${name}${c.reset} ${c.dim}· ${new Date(session.timestamp).toLocaleString()}${c.reset}`);
      }
    }
    console.log();
  } catch (e) {
    console.log(`${c.red}✗${c.reset} Error listing sessions\n`);
  }
}

// Snippets
async function saveSnippet(name, code) {
  snippetsLibrary[name] = { code, timestamp: new Date().toISOString() };
  await saveSnippets();
  console.log(`${c.green}✓${c.reset} Snippet saved: ${c.cyan}${name}${c.reset}\n`);
}

async function loadSnippet(name) {
  const snippet = snippetsLibrary[name];
  if (!snippet) {
    console.log(`${c.red}✗${c.reset} Snippet not found: ${name}\n`);
    return null;
  }
  return snippet.code;
}

async function listSnippets() {
  const names = Object.keys(snippetsLibrary);
  if (names.length === 0) {
    console.log(`${c.yellow}⚠${c.reset} No saved snippets\n`);
    return;
  }
  
  console.log(`${c.bold}${c.brightCyan}✂️  Code Snippets${c.reset}\n`);
  for (const name of names) {
    const snippet = snippetsLibrary[name];
    const preview = snippet.code.split('\n')[0].slice(0, 50);
    console.log(`  ${c.cyan}${name}${c.reset} ${c.dim}· ${preview}...${c.reset}`);
  }
  console.log();
}

function suggestNextAction(cmd) {
  const suggestions = {
    'ask': ['review', 'test', 'document'],
    'read': ['edit', 'review', 'metrics'],
    'edit': ['read', 'test'],
    'review': ['refactor', 'edit'],
  };
  
  const cmds = suggestions[cmd] || [];
  if (cmds.length > 0 && settings.autoSuggest) {
    console.log(`${c.dim}💡 Try: ${cmds.map(c => `${c.cyan}${c}${c.reset}`).join(', ')}${c.reset}\n`);
  }
}

async function handleAsk(prompt, rl) {
  conversationHistory.push({ role: "user", content: prompt });
  
  if (conversationHistory.length > settings.maxHistory * 2) {
    conversationHistory = conversationHistory.slice(-settings.maxHistory * 2);
  }
  
  startSpinner("Analyzing query");
  const relevantFiles = await discoverRelevantFiles(prompt);
  stopSpinner();
  
  let allowedFiles = [];
  let filesContext = "";
  
  if (relevantFiles.length > 0) {
    if (settings.askPermission) {
      allowedFiles = await requestFilePermission(relevantFiles, rl);
    } else {
      allowedFiles = relevantFiles;
      console.log(`\n${c.dim}Reading ${allowedFiles.length} file(s)...${c.reset}\n`);
    }
    
    if (allowedFiles.length > 0) {
      console.log(`${c.green}✓${c.reset} Reading files...\n`);
      
      for (const file of allowedFiles) {
        try {
          const content = await readFileQuietly(file);
          const icon = getFileIcon(path.extname(file));
          console.log(`  ${icon} ${c.cyan}${file}${c.reset} ${c.dim}(${content.split('\n').length} lines)${c.reset}`);
          filesContext += `\n\n=== ${file} ===\n${content}\n`;
        } catch (e) {
          console.log(`  ${c.red}✗${c.reset} ${c.cyan}${file}${c.reset} ${c.dim}(error)${c.reset}`);
        }
      }
      console.log();
    } else {
      console.log(`${c.yellow}⚠${c.reset} No files read. Using general knowledge...\n`);
    }
  }
  
  const messages = [];
  const systemPrompt = filesContext 
    ? `You are a helpful AI assistant. Here are relevant files:\n${filesContext}\n\nProvide detailed, accurate answers based on the actual code.`
    : "You are a helpful AI assistant. Provide clear, concise answers.";
  
  messages.push({ role: "system", content: systemPrompt });
  messages.push(...conversationHistory);
  
  startSpinner("Thinking");
  const { text } = await pplx(messages);
  stopSpinner();
  
  conversationHistory.push({ role: "assistant", content: text });
  
  console.log(`${c.bold}${c.brightMagenta}◈ AI Response:${c.reset}\n`);
  console.log(formatResponse(text));
  console.log();
  
  suggestNextAction("ask");
}

function showHistory() {
  if (conversationHistory.length === 0) {
    console.log(`${c.yellow}⚠${c.reset} No conversation history\n`);
    return;
  }
  
  console.log(`${c.bold}${c.brightCyan}📜 History${c.reset}${c.dim} · ${conversationHistory.length} messages${c.reset}\n`);
  
  for (let i = 0; i < conversationHistory.length; i++) {
    const msg = conversationHistory[i];
    const icon = msg.role === "user" ? "👤" : "🤖";
    const color = msg.role === "user" ? c.cyan : c.magenta;
    const preview = msg.content.slice(0, 100) + (msg.content.length > 100 ? "..." : "");
    console.log(`${color}${icon} ${msg.role}:${c.reset} ${preview}`);
  }
  console.log();
}

async function showSettings() {
  const bool = (val) => val ? c.green + "✓" : c.red + "✗";
  
  console.log(`
${c.bold}${c.brightCyan}⚙️  Configuration${c.reset}

${c.bold}${c.brightMagenta}━━ AI Settings ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
${c.dim}Model:${c.reset}              ${c.yellow}${settings.model}${c.reset}
${c.dim}Temperature:${c.reset}        ${c.yellow}${settings.temperature}${c.reset}
${c.dim}Edit Temp:${c.reset}          ${c.yellow}${settings.editTemp}${c.reset}
${c.dim}Max History:${c.reset}        ${c.yellow}${settings.maxHistory} messages${c.reset}

${c.bold}${c.blue}━━ Interface ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
${c.dim}Conversational Mode:${c.reset} ${bool(settings.conversationalMode)}${c.reset} ${c.dim}(no 'ask' needed)${c.reset}
${c.dim}Syntax Highlight:${c.reset}   ${bool(settings.syntax)}${c.reset}
${c.dim}Auto Suggest:${c.reset}       ${bool(settings.autoSuggest)}${c.reset}
${c.dim}Color Scheme:${c.reset}       ${c.yellow}${settings.colorScheme}${c.reset}
${c.dim}Compact Mode:${c.reset}       ${bool(settings.compactMode)}${c.reset}
${c.dim}Verbose:${c.reset}            ${bool(settings.verbose)}${c.reset}
${c.dim}Show Timestamps:${c.reset}    ${bool(settings.showTimestamps)}${c.reset}
${c.dim}Quiet Mode:${c.reset}         ${bool(settings.quietMode)}${c.reset}

${c.bold}${c.green}━━ Smart Features ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
${c.dim}Smart File Detection:${c.reset} ${bool(settings.smartFileDetection)}${c.reset}
${c.dim}Auto Context:${c.reset}       ${bool(settings.autoContext)}${c.reset}
${c.dim}Smart Context:${c.reset}      ${bool(settings.smartContext)}${c.reset}
${c.dim}Deep Analysis:${c.reset}      ${bool(settings.deepAnalysis)}${c.reset}
${c.dim}Ask Permission:${c.reset}     ${bool(settings.askPermission)}${c.reset}
${c.dim}Max Files/Query:${c.reset}    ${c.yellow}${settings.maxFilesPerQuery}${c.reset}
${c.dim}Show File Preview:${c.reset}  ${bool(settings.showFilePreview)}${c.reset}

${c.bold}${c.yellow}━━ Automation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
${c.dim}Auto Save:${c.reset}          ${bool(settings.autoSave)}${c.reset}
${c.dim}Auto Format:${c.reset}        ${bool(settings.autoFormat)}${c.reset}
${c.dim}Auto Commit:${c.reset}        ${bool(settings.autoCommit)}${c.reset}
${c.dim}Git Integration:${c.reset}    ${bool(settings.gitIntegration)}${c.reset}

${c.bold}${c.magenta}━━ Advanced ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
${c.dim}Cache Responses:${c.reset}    ${bool(settings.cacheResponses)}${c.reset}
${c.dim}Streaming Mode:${c.reset}     ${bool(settings.streamingMode)}${c.reset}
${c.dim}Debug Mode:${c.reset}         ${bool(settings.debugMode)}${c.reset}

${c.dim}Usage:${c.reset} ${c.cyan}settings set${c.reset} ${c.yellow}<key> <value>${c.reset}
${c.dim}Models: sonar-pro, sonar-reasoning, sonar${c.reset}
${c.dim}Color schemes: vibrant, minimal, dark, light${c.reset}
  `);
}

async function pasteMultiline(rl) {
  console.log(`${c.dim}Paste content. End with${c.reset} ${c.yellow}::end${c.reset}\n`);
  const lines = [];
  while (true) {
    const line = await rl.question("");
    if (line.trim() === "::end") break;
    lines.push(line);
  }
  return lines.join("\n");
}

function help() {
  console.log(`
${c.bold}${c.brightCyan}╭─────────────────────────────────────────────────────────────╮${c.reset}
${c.bold}${c.brightCyan}│${c.reset}  ${c.bold}${c.brightMagenta}✨ Perplexity CLI Agent${c.reset} ${c.dim}v2.5 Ultimate${c.reset}                ${c.bold}${c.brightCyan}│${c.reset}
${c.bold}${c.brightCyan}╰─────────────────────────────────────────────────────────────╯${c.reset}

${c.bold}${c.brightCyan}📍 Root:${c.reset} ${c.yellow}${path.basename(ROOT)}${c.reset}  ${c.bold}${c.brightCyan}🤖 Model:${c.reset} ${c.yellow}${MODEL}${c.reset}

${c.bold}${c.brightMagenta}━━ 💬 AI Chat ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
  ${c.cyan}ask${c.reset} ${c.dim}<prompt>${c.reset}              Chat with AI (reads code!)
  ${c.cyan}clear${c.reset}                       Clear conversation
  ${c.cyan}history${c.reset}                     Show chat history
  
${c.bold}${c.blue}━━ 📁 Navigation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
  ${c.cyan}ls${c.reset} ${c.dim}[dir]${c.reset}                   List directory
  ${c.cyan}cd${c.reset} ${c.dim}<dir>${c.reset}                   Change directory
  ${c.cyan}tree${c.reset} ${c.dim}[dir]${c.reset}                 Directory tree
  ${c.cyan}find${c.reset} ${c.dim}<pattern>${c.reset}             Find files
  ${c.cyan}@${c.reset}                           Quick file list
  
${c.bold}${c.green}━━ 📝 Files ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
  ${c.cyan}read${c.reset} ${c.dim}<file>${c.reset}                Read with highlighting
  ${c.cyan}write${c.reset} ${c.dim}<file>${c.reset}               Create/edit file
  ${c.cyan}edit${c.reset} ${c.dim}<file> <prompt>${c.reset}       AI-powered editing
  ${c.cyan}stat${c.reset} ${c.dim}<path>${c.reset}                File info
  ${c.cyan}mkdir${c.reset} ${c.dim}<dir>${c.reset}                Create directory
  ${c.cyan}cp${c.reset}/${c.cyan}mv${c.reset}/${c.cyan}rm${c.reset} ${c.dim}<paths>${c.reset}           Copy/move/delete
  
${c.bold}${c.brightYellow}━━ 🔧 Dev Tools ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
  ${c.cyan}review${c.reset} ${c.dim}<file>${c.reset}              AI code review
  ${c.cyan}test${c.reset} ${c.dim}<file>${c.reset}                Generate tests
  ${c.cyan}document${c.reset} ${c.dim}<file>${c.reset}            Generate docs
  ${c.cyan}refactor${c.reset} ${c.dim}<file>${c.reset}            AI refactoring
  ${c.cyan}metrics${c.reset} ${c.dim}<file>${c.reset}             Code metrics
  ${c.cyan}scaffold${c.reset} ${c.dim}<type> <n>${c.reset}        Generate component
  
${c.bold}${c.magenta}━━ 🔀 Git ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
  ${c.cyan}git status${c.reset}                  Git status
  ${c.cyan}git diff${c.reset}                    Git diff
  ${c.cyan}git log${c.reset}                     Recent commits
  ${c.cyan}commit${c.reset}                      Generate commit msg

${c.bold}${c.brightCyan}━━ 💾 Sessions & Snippets ━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
  ${c.cyan}session save${c.reset} ${c.dim}<name>${c.reset}        Save session
  ${c.cyan}session load${c.reset} ${c.dim}<name>${c.reset}        Load session
  ${c.cyan}session list${c.reset}                List sessions
  ${c.cyan}snippet save${c.reset} ${c.dim}<name>${c.reset}        Save snippet
  ${c.cyan}snippet get${c.reset} ${c.dim}<name>${c.reset}         Get snippet
  ${c.cyan}snippet list${c.reset}                List snippets
  
${c.bold}${c.yellow}━━ ⚙️  System ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
  ${c.cyan}settings${c.reset}                    View config
  ${c.cyan}settings set${c.reset} ${c.dim}<k> <v>${c.reset}       Update setting
  ${c.cyan}root${c.reset}                        Show root
  ${c.cyan}help${c.reset}                        This help
  ${c.cyan}quit${c.reset}                        Exit

${c.dim}💡 Try:${c.reset} ${c.cyan}ask "what does this app do?"${c.reset}
  `);
}

// Main function
async function main() {
  const rl = readline.createInterface({ input, output });

  console.log(`
${c.bold}${c.brightCyan}╭─────────────────────────────────────────────────────────────╮${c.reset}
${c.bold}${c.brightCyan}│${c.reset}  ${c.bold}${c.brightMagenta}✨ Perplexity CLI Agent${c.reset} ${c.dim}v2.5 Ultimate${c.reset}                ${c.bold}${c.brightCyan}│${c.reset}
${c.bold}${c.brightCyan}│${c.reset}  ${c.dim}AI development assistant for${c.reset} ${c.yellow}${path.basename(ROOT)}${c.reset}       ${c.bold}${c.brightCyan}│${c.reset}
${c.bold}${c.brightCyan}╰─────────────────────────────────────────────────────────────╯${c.reset}

${c.dim}Type${c.reset} ${c.cyan}help${c.reset} ${c.dim}for commands or${c.reset} ${c.cyan}ask${c.reset} ${c.dim}to start chatting${c.reset}
`);

  startSpinner("Analyzing project");
  const projectType = await analyzeProject();
  stopSpinner();
  console.log(`${c.green}✓${c.reset} Detected ${c.yellow}${projectType}${c.reset} project\n`);

  while (true) {
    const rel = path.basename(ROOT);
    const prompt = `${c.bold}${c.brightCyan}${rel}${c.reset} ${c.brightMagenta}›${c.reset} `;
    let line = (await rl.question(prompt)).trim();
    if (!line) continue;

    if (line === "@") {
      const files = await collectProjectFiles();
      if (files.length > 0) {
        console.log(`${c.bold}${c.brightCyan}📁 Project Files${c.reset}\n`);
        files.slice(0, 20).forEach((f, i) => {
          const icon = getFileIcon(path.extname(f));
          console.log(`  ${c.gray}${String(i + 1).padStart(2)}.${c.reset} ${icon} ${c.cyan}${f}${c.reset}`);
        });
        if (files.length > 20) {
          console.log(`  ${c.dim}... and ${files.length - 20} more${c.reset}`);
        }
      }
      console.log();
      continue;
    }

    const [cmd, ...rest] = line.split(" ");
    
    // Conversational mode: treat non-commands as "ask"
    if (settings.conversationalMode && ![
      "quit", "exit", "help", "ask", "clear", "history", "settings",
      "root", "ls", "cd", "tree", "find", "stat", "mkdir", "rm", "cp", "mv",
      "read", "write", "edit", "review", "test", "document", "refactor",
      "metrics", "scaffold", "git", "commit", "session", "snippet", "@"
    ].includes(cmd)) {
      // Treat entire line as ask prompt
      await handleAsk(line, rl);
      continue;
    }
    
    lastCommand = cmd;
    
    try {
      if (cmd === "quit" || cmd === "exit") {
        console.log(`\n${c.brightCyan}👋 Thanks for using Perplexity CLI Agent!${c.reset}\n`);
        break;
      }
      else if (cmd === "help") help();
      else if (cmd === "ask") {
        const userPrompt = rest.join(" ");
        if (!userPrompt) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}ask${c.reset} ${c.dim}<question>${c.reset}\n`);
          continue;
        }
        await handleAsk(userPrompt, rl);
      }
      else if (cmd === "clear") {
        conversationHistory = [];
        projectContext = null;
        console.log(`${c.green}✓${c.reset} Conversation cleared\n`);
      }
      else if (cmd === "history") showHistory();
      else if (cmd === "settings") {
        if (rest[0] === "set" && rest.length >= 3) {
          const key = rest[1];
          const value = rest.slice(2).join(" ");
          const boolVal = value.toLowerCase() === "true";
          
          if (key === "model") {
            settings.model = value;
            MODEL = value;
          } else if (key === "temperature") {
            settings.temperature = Math.min(1, Math.max(0, parseFloat(value)));
          } else if (key === "editTemp") {
            settings.editTemp = Math.min(1, Math.max(0, parseFloat(value)));
          } else if (key === "maxHistory") {
            settings.maxHistory = parseInt(value);
          } else if (key === "maxFilesPerQuery") {
            settings.maxFilesPerQuery = parseInt(value);
          } else if (key === "colorScheme") {
            settings.colorScheme = value;
          } else if (key === "autoContext") {
            settings.autoContext = boolVal;
          } else if (key === "syntax") {
            settings.syntax = boolVal;
          } else if (key === "askPermission") {
            settings.askPermission = boolVal;
          } else if (key === "autoSuggest") {
            settings.autoSuggest = boolVal;
          } else if (key === "gitIntegration") {
            settings.gitIntegration = boolVal;
          } else if (key === "conversationalMode") {
            settings.conversationalMode = boolVal;
            console.log(`${c.green}✓${c.reset} Conversational mode ${boolVal ? 'enabled' : 'disabled'}. ${boolVal ? "You can now chat without 'ask'!" : ""}\n`);
          } else if (key === "smartFileDetection") {
            settings.smartFileDetection = boolVal;
          } else if (key === "showFilePreview") {
            settings.showFilePreview = boolVal;
          } else if (key === "autoSave") {
            settings.autoSave = boolVal;
          } else if (key === "verbose") {
            settings.verbose = boolVal;
          } else if (key === "compactMode") {
            settings.compactMode = boolVal;
          } else if (key === "showTimestamps") {
            settings.showTimestamps = boolVal;
          } else if (key === "autoCommit") {
            settings.autoCommit = boolVal;
          } else if (key === "autoFormat") {
            settings.autoFormat = boolVal;
          } else if (key === "cacheResponses") {
            settings.cacheResponses = boolVal;
          } else if (key === "streamingMode") {
            settings.streamingMode = boolVal;
          } else if (key === "debugMode") {
            settings.debugMode = boolVal;
          } else if (key === "quietMode") {
            settings.quietMode = boolVal;
          } else if (key === "smartContext") {
            settings.smartContext = boolVal;
          } else if (key === "deepAnalysis") {
            settings.deepAnalysis = boolVal;
          } else {
            console.log(`${c.red}✗${c.reset} Unknown setting: ${c.yellow}${key}${c.reset}\n`);
            continue;
          }
          
          await saveSettings();
          if (key !== "conversationalMode") {
            console.log(`${c.green}✓${c.reset} ${c.cyan}${key}${c.reset} = ${c.yellow}${value}${c.reset}\n`);
          }
        } else {
          await showSettings();
        }
      }
      else if (cmd === "root") console.log(`${c.brightCyan}📍${c.reset} ${c.yellow}${ROOT}${c.reset}\n`);
      else if (cmd === "ls") await listDir(rest.join(" ") || ".");
      else if (cmd === "cd") {
        const target = rest.join(" ");
        if (!target) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}cd${c.reset} ${c.dim}<directory>${c.reset}\n`);
          continue;
        }
        ROOT = safePath(target);
        projectContext = null;
        console.log(`${c.green}✓${c.reset} Changed to ${c.cyan}${ROOT}${c.reset}\n`);
      }
      else if (cmd === "tree") await treeDir(rest.join(" ") || ".");
      else if (cmd === "find") {
        const pattern = rest[0];
        if (!pattern) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}find${c.reset} ${c.dim}<pattern>${c.reset}\n`);
          continue;
        }
        await find(pattern, rest[1] ?? ".");
      }
      else if (cmd === "stat") {
        const target = rest.join(" ");
        if (!target) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}stat${c.reset} ${c.dim}<path>${c.reset}\n`);
          continue;
        }
        await stat(target);
      }
      else if (cmd === "mkdir") {
        const dir = rest.join(" ");
        if (!dir) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}mkdir${c.reset} ${c.dim}<directory>${c.reset}\n`);
          continue;
        }
        await mkdir(dir);
      }
      else if (cmd === "rm") {
        const target = rest.join(" ");
        if (!target) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}rm${c.reset} ${c.dim}<path>${c.reset}\n`);
          continue;
        }
        const confirm = (await rl.question(`${c.yellow}⚠  Delete ${target}?${c.reset} ${c.dim}(y/n)${c.reset}: `)).trim().toLowerCase();
        if (confirm === "y" || confirm === "yes") await rm(target);
        else console.log(`${c.gray}Cancelled${c.reset}\n`);
      }
      else if (cmd === "cp") {
        if (rest.length < 2) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}cp${c.reset} ${c.dim}<source> <dest>${c.reset}\n`);
          continue;
        }
        await cp(rest[0], rest.slice(1).join(" "));
      }
      else if (cmd === "mv") {
        if (rest.length < 2) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}mv${c.reset} ${c.dim}<source> <dest>${c.reset}\n`);
          continue;
        }
        await mv(rest[0], rest.slice(1).join(" "));
      }
      else if (cmd === "read") {
        const file = rest.join(" ");
        if (!file) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}read${c.reset} ${c.dim}<file>${c.reset}\n`);
          continue;
        }
        await readFile(file);
      }
      else if (cmd === "write") {
        const file = rest.join(" ");
        if (!file) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}write${c.reset} ${c.dim}<file>${c.reset}\n`);
          continue;
        }
        const content = await pasteMultiline(rl);
        await writeFile(file, content);
        console.log(`${c.green}✓${c.reset} Written to ${c.cyan}${file}${c.reset}\n`);
      }
      else if (cmd === "edit") {
        const file = rest.shift();
        const instruction = rest.join(" ");
        if (!file || !instruction) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}edit${c.reset} ${c.dim}<file> <instruction>${c.reset}\n`);
          continue;
        }
        const original = await readFileQuietly(file);
        const sys = "You are a code editor. Return ONLY updated file content, no markdown fences or explanations.";
        const user = `File: ${file}\nInstruction: ${instruction}\n\nCurrent:\n${original}`;
        startSpinner("Editing");
        const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: settings.editTemp });
        stopSpinner();
        console.log(`\n${c.bold}${c.yellow}━━ Proposed Changes ━━${c.reset}\n`);
        console.log(text.slice(0, 500) + (text.length > 500 ? "\n..." : ""));
        console.log(`\n${c.bold}${c.yellow}━━━━━━━━━━━━━━━━━━${c.reset}\n`);
        const confirm = (await rl.question(`${c.cyan}Save?${c.reset} ${c.dim}(y/n)${c.reset}: `)).trim().toLowerCase();
        if (confirm === "y" || confirm === "yes") {
          await writeFile(file, text);
          console.log(`${c.green}✓${c.reset} Saved ${c.cyan}${file}${c.reset}\n`);
        } else {
          console.log(`${c.gray}Not saved${c.reset}\n`);
        }
      }
      else if (cmd === "review") {
        const file = rest.join(" ");
        if (!file) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}review${c.reset} ${c.dim}<file>${c.reset}\n`);
          continue;
        }
        await reviewCode(file);
      }
      else if (cmd === "test") {
        const file = rest.join(" ");
        if (!file) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}test${c.reset} ${c.dim}<file>${c.reset}\n`);
          continue;
        }
        const testCode = await generateTests(file);
        console.log(`\n${c.bold}${c.brightCyan}🧪 Generated Tests${c.reset}\n`);
        console.log(formatResponse(testCode));
        console.log();
        const testFile = file.replace(/\.(\w+)$/, ".test.$1");
        const save = (await rl.question(`${c.cyan}Save to ${testFile}?${c.reset} ${c.dim}(y/n)${c.reset}: `)).trim().toLowerCase();
        if (save === "y" || save === "yes") {
          await writeFile(testFile, testCode);
          console.log(`${c.green}✓${c.reset} Saved ${c.cyan}${testFile}${c.reset}\n`);
        }
      }
      else if (cmd === "document") {
        const file = rest.join(" ");
        if (!file) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}document${c.reset} ${c.dim}<file>${c.reset}\n`);
          continue;
        }
        const docCode = await generateDocs(file);
        console.log(`\n${c.bold}${c.brightCyan}📝 Documented Code${c.reset}\n`);
        console.log(formatResponse(docCode));
        console.log();
        const save = (await rl.question(`${c.cyan}Save?${c.reset} ${c.dim}(y/n)${c.reset}: `)).trim().toLowerCase();
        if (save === "y" || save === "yes") {
          await writeFile(file, docCode);
          console.log(`${c.green}✓${c.reset} Saved ${c.cyan}${file}${c.reset}\n`);
        }
      }
      else if (cmd === "refactor") {
        const file = rest.join(" ");
        if (!file) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}refactor${c.reset} ${c.dim}<file>${c.reset}\n`);
          continue;
        }
        const original = await readFileQuietly(file);
        const sys = "Refactor this code: improve structure, performance, readability, follow best practices. Return ONLY the refactored code.";
        const user = `Refactor:\n\n${original}`;
        startSpinner("Refactoring");
        const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: 0.2 });
        stopSpinner();
        console.log(`\n${c.bold}${c.brightYellow}♻️  Refactored Code${c.reset}\n`);
        console.log(formatResponse(text.slice(0, 500) + "..."));
        console.log();
        const save = (await rl.question(`${c.cyan}Save?${c.reset} ${c.dim}(y/n)${c.reset}: `)).trim().toLowerCase();
        if (save === "y" || save === "yes") {
          await writeFile(file, text);
          console.log(`${c.green}✓${c.reset} Saved ${c.cyan}${file}${c.reset}\n`);
        }
      }
      else if (cmd === "metrics") {
        const file = rest.join(" ");
        if (!file) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}metrics${c.reset} ${c.dim}<file>${c.reset}\n`);
          continue;
        }
        await codeMetrics(file);
      }
      else if (cmd === "scaffold") {
        if (rest.length < 2) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}scaffold${c.reset} ${c.dim}<type> <name>${c.reset}\n`);
          continue;
        }
        const { filename, content } = await scaffold(rest[0], rest[1]);
        const save = (await rl.question(`${c.cyan}Save as ${filename}?${c.reset} ${c.dim}(y/n)${c.reset}: `)).trim().toLowerCase();
        if (save === "y" || save === "yes") {
          await writeFile(filename, content);
          console.log(`${c.green}✓${c.reset} Created ${c.cyan}${filename}${c.reset}\n`);
        }
      }
      else if (cmd === "git") {
        if (rest[0] === "status") {
          const status = getGitStatus();
          if (status) {
            console.log(`\n${c.bold}${c.brightCyan}🔀 Git Status${c.reset}\n`);
            console.log(status);
          } else {
            console.log(`${c.yellow}⚠${c.reset} Not a git repository\n`);
          }
        } else if (rest[0] === "diff") {
          const diff = getGitDiff();
          if (diff) {
            console.log(`\n${c.bold}${c.brightCyan}🔀 Git Diff${c.reset}\n`);
            console.log(diff.slice(0, 1000) + (diff.length > 1000 ? "\n..." : ""));
          } else {
            console.log(`${c.yellow}⚠${c.reset} No changes\n`);
          }
        } else if (rest[0] === "log") {
          const log = getGitLog();
          if (log) {
            console.log(`\n${c.bold}${c.brightCyan}📜 Git Log${c.reset}\n`);
            console.log(log + "\n");
          } else {
            console.log(`${c.yellow}⚠${c.reset} Not a git repository\n`);
          }
        }
      }
      else if (cmd === "commit") await generateCommitMessage();
      else if (cmd === "session") {
        if (rest[0] === "save" && rest[1]) {
          await saveSession(rest[1]);
        } else if (rest[0] === "load" && rest[1]) {
          await loadSession(rest[1]);
        } else if (rest[0] === "list") {
          await listSessions();
        } else {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}session save/load/list <name>${c.reset}\n`);
        }
      }
      else if (cmd === "snippet") {
        if (rest[0] === "save" && rest[1]) {
          console.log(`${c.dim}Paste snippet. End with${c.reset} ${c.yellow}::end${c.reset}\n`);
          const code = await pasteMultiline(rl);
          await saveSnippet(rest[1], code);
        } else if (rest[0] === "get" && rest[1]) {
          const code = await loadSnippet(rest[1]);
          if (code) {
            console.log(`\n${c.bold}${c.brightCyan}✂️  ${rest[1]}${c.reset}\n`);
            console.log(code + "\n");
          }
        } else if (rest[0] === "list") {
          await listSnippets();
        } else {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}snippet save/get/list <name>${c.reset}\n`);
        }
      }
      else {
        console.log(`${c.red}✗${c.reset} Unknown: ${c.yellow}${cmd}${c.reset}`);
        console.log(`${c.dim}Try${c.reset} ${c.cyan}help${c.reset}\n`);
      }
    } catch (e) {
      console.error(`${c.red}✗ Error:${c.reset} ${e?.message ?? String(e)}\n`);
    }
  }

  rl.close();
}

main().catch(err => {
  console.error(`${c.red}Fatal: ${err.message}${c.reset}`);
  process.exit(1);
});
