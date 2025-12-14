#!/usr/bin/env node

import readline from "node:readline/promises";
import { emitKeypressEvents } from "node:readline";
import process from "node:process";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";

// Config
import { KEY, getRoot, setRoot, safePath } from "../src/config/constants.mjs";
import { loadSettings, saveSettings } from "../src/config/settings.mjs";

// UI
import { c } from "../src/ui/colors.mjs";
import { startSpinner, stopSpinner } from "../src/ui/spinner.mjs";
import { formatResponse, showDiff } from "../src/ui/formatting.mjs";
import { help, showSettings, pasteMultiline, suggestNextAction, showHistory } from "../src/ui/help.mjs";
import { printGeminiStyleBanner } from "../src/ui/banner.mjs";

// API
import { pplx, usageStats } from "../src/api/perplexity.mjs";
import { classifyQuery } from "../src/api/router.mjs";

// Filesystem
import { readFile, readFileQuietly, writeFile, listDir, mkdir, rm, cp, mv, stat, restoreBackup } from "../src/filesystem/operations.mjs";
import { treeDir, find } from "../src/filesystem/navigation.mjs";

// Git
import { isGitRepo, getGitStatus, getGitDiff, getGitLog } from "../src/git/operations.mjs";

// Project
import { analyzeProject, collectProjectFiles, grepProject, scanTodos, analyzeDeps } from "../src/project/analysis.mjs";
import { discoverRelevantFiles, traceImports, requestFilePermission } from "../src/project/context.mjs";

// Tools
import { reviewCode, codeMetrics } from "../src/tools/code-analysis.mjs";
import { generateTests, generateDocs, refactorCode, generateCommitMessage } from "../src/tools/code-generation.mjs";
import { scaffold } from "../src/tools/scaffold.mjs";

// Sessions
import { saveSession, loadSession, listSessions } from "../src/sessions/sessions.mjs";
import { loadSnippetsLibrary, saveSnippets, saveSnippet, loadSnippet, listSnippets } from "../src/sessions/snippets.mjs";

// Brain
import { loadBrain, saveBrain, initBrain, updateBrain, showBrain } from "../src/brain/brain.mjs";

// Check API key
if (!KEY) {
  console.error(`${c.red}✗ Missing PPLX_API_KEY${c.reset}\nSet it: export PPLX_API_KEY=your_key\n`);
  process.exit(1);
}

// Global state
let settings = await loadSettings();
let conversationHistory = [];
let snippetsLibrary = await loadSnippetsLibrary();
let projectBrain = await loadBrain();
let lastCommand = "";
let lastError = null;

async function handleAsk(prompt, rl) {
  conversationHistory.push({ role: "user", content: prompt });

  if (conversationHistory.length > settings.maxHistory * 2) {
    conversationHistory = conversationHistory.slice(-settings.maxHistory * 2);
  }

  startSpinner("Analyzing query");
  const relevantFiles = await discoverRelevantFiles(prompt, settings);
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
          console.log(`  📄 ${c.cyan}${file}${c.reset} ${c.dim}(${content.split('\n').length} lines)${c.reset}`);
          filesContext += `\n\n=== ${file} ===\n${content}\n`;
        } catch (e) {
          console.log(`  ${c.red}✗${c.reset} ${c.cyan}${file}${c.reset} ${c.dim}(error)${c.reset}`);
        }
      }
      console.log();
    } else {
      console.log(`${c.yellow}⚠${c.reset} No files read. Using general knowledge...\n`);
    }

    // Smart Import Tracing
    if (settings.deepAnalysis && allowedFiles.length > 0) {
      startSpinner("Tracing imports");
      const traced = await traceImports(allowedFiles);
      if (traced.length > 0) {
        console.log(`${c.dim}  + Traced ${traced.length} dependency file(s)${c.reset}`);
        for (const t of traced) {
          filesContext += `\n\n=== [TRACED] ${t.file} ===\n(First 50 lines preview)\n${t.content}\n`;
        }
      }
      stopSpinner();
    }
  }

  const messages = [];
  const brainContext = projectBrain.description || projectBrain.architecture
    ? `\n\n=== PROJECT BRAIN ===\n${JSON.stringify(projectBrain, null, 2)}\n`
    : "";

  const systemPrompt = filesContext
    ? `You are a helpful AI assistant. Use the project brain and files below:\n${brainContext}\n${filesContext}\n\nProvide detailed, accurate answers based on the actual code.`
    : `You are a helpful AI assistant. Use this project context:\n${brainContext}\nProvide clear, concise answers.`;

  messages.push({ role: "system", content: systemPrompt });

  if (settings.role) {
    messages.push({ role: "system", content: `IMPORTANT: Adopt the persona of: ${settings.role}` });
  }

  messages.push(...conversationHistory);

  // Semantic Routing
  let effectiveModel = settings.model;
  const suggestedModel = classifyQuery(prompt);
  if (suggestedModel && settings.model !== suggestedModel && settings.smartContext) {
    effectiveModel = suggestedModel;
    console.log(`${c.dim}🧠 Smart Route: Switching to ${c.magenta}${effectiveModel}${c.reset}${c.dim} for complex task${c.reset}\n`);
  }

  startSpinner("Thinking");
  const { text } = await pplx(messages, { model: effectiveModel, settings });
  stopSpinner();

  conversationHistory.push({ role: "assistant", content: text });

  console.log(`${c.bold}${c.brightMagenta}◈ AI Response:${c.reset}\n`);
  console.log(formatResponse(text));
  console.log();

  suggestNextAction("ask", settings);
}

async function main() {
  const rl = readline.createInterface({ input, output });

  // Handle Double Ctrl+C to Exit
  let lastSigInt = 0;
  rl.on('SIGINT', () => {
    const now = Date.now();
    if (now - lastSigInt < 500) {
      console.log(`\n${c.dim}Force quitting...${c.reset}`);
      process.exit(0);
    }
    lastSigInt = now;
    console.log(`\n${c.yellow}(Press Ctrl+C again to quit)${c.reset} `);
    // Re-display prompt if in middle of input? 
    // rl.prompt(true); // We aren't using rl.prompt() standard mode but question loop.
    // The question loop might break visual if we don't handle it carefully.
  });

  // Handle Double ESC
  // We need to emit keypress events for stdin
  emitKeypressEvents(input);
  if (input.isTTY) input.setRawMode(true);

  let lastEsc = 0;
  input.on('keypress', (str, key) => {
    // Check for standard ESC
    if (key.name === 'escape') {
      const now = Date.now();
      if (now - lastEsc < 500) {
        console.log(`\n${c.dim}Exiting...${c.reset}`);
        process.exit(0);
      }
      lastEsc = now;
    }
    // Handle Ctrl+C (if raw mode captures it and doesn't trigger SIGINT automatically)
    // Actually, in raw mode, Ctrl+C might needs manual handling or rl handles it?
    // readline interface usually handles Ctrl+C -> SIGINT even in raw mode if configured.
    // But let's check key sequence just in case.
    if (key.ctrl && key.name === 'c') {
      // This usually triggers SIGINT above, so we might not need to duplicate logic 
      // unless raw mode suppresses it.
    }
  });

  // Clear screen to force top-left position
  process.stdout.write('\x1Bc');

  printGeminiStyleBanner();

  startSpinner("Analyzing project");
  const projectType = await analyzeProject();
  stopSpinner();
  console.log(`${c.green}✓${c.reset} Detected ${c.yellow}${projectType}${c.reset} project\n`);

  // Initial Status Line
  // Initial Status Line
  const fileCount = (await collectProjectFiles().catch(() => [])).length;
  console.log(`${c.dim}Using: ${c.reset}${c.cyan}${fileCount} files${c.reset}${c.dim} in context${c.reset}`);

  while (true) {
    // Spacer
    console.log();

    // Dynamic width box
    const width = process.stdout.columns || 80;
    // Box borders: ╭ ─ ╮ │ ╰ ╯
    // We want the box to be full width minus a bit of margin? Or full? 
    // Reference image shows partial width (not full edge-to-edge).
    // Let's do width - 2 (margin).
    const boxWidth = Math.max(20, width - 2);
    const lineChar = "─";

    const topBorder = `${c.pplx.teal}╭${lineChar.repeat(boxWidth - 2)}╮${c.reset}`;
    const botBorder = `${c.pplx.teal}╰${lineChar.repeat(boxWidth - 2)}╯${c.reset}`;

    // Box Top
    console.log(topBorder);

    // Spacer
    console.log(" ");

    // Box Bottom
    console.log(botBorder);

    // Move Up 2 lines
    process.stdout.write('\x1B[2A');

    // Prompt
    const prompt = `${c.pplx.teal}│${c.reset} ${c.bold}${c.pplx.white || c.white}λ${c.reset} `;
    let line = (await rl.question(prompt)).trim();

    // Move down
    process.stdout.write('\n'); // rl.question adds a newline, so we are on the bottom border line.
    // We just need to make sure we don't overwrite it if the user just printed something?
    // Actually, when user hits enter, cursor moves to next line (which is the bottom border line).
    // The previous bottom border is now "behind" the cursor's new position?
    // No, standard TTY behavior:
    // 1. Print Bottom
    // 2. Up 1 line
    // 3. Print Prompt
    // 4. User types "foo\n"
    // 5. \n causes cursor to go to next line (Start of Bottom Border line)
    // 6. We are now effectively overwriting the bottom border line with next output?
    // We should print a newline to jump over it?
    // OR we can just reprint the bottom border to be clean.
    // Let's force a newline to be safe and simple.
    // process.stdout.write('\n');

    if (!line) continue;

    // Quick file list
    if (line === "@") {
      const files = await collectProjectFiles();
      if (files.length > 0) {
        console.log(`${c.bold}${c.brightCyan}📁 Project Files${c.reset}\n`);
        files.slice(0, 20).forEach((f, i) => {
          console.log(`  ${c.gray}${String(i + 1).padStart(2)}.${c.reset} 📄 ${c.cyan}${f}${c.reset}`);
        });
        if (files.length > 20) {
          console.log(`  ${c.dim}... and ${files.length - 20} more${c.reset}`);
        }
      }
      console.log();
      continue;
    }

    let [cmd, ...rest] = line.split(" ");
    if (cmd.startsWith("/")) cmd = cmd.slice(1);

    // Conversational mode
    if (settings.conversationalMode && ![
      "quit", "exit", "help", "ask", "clear", "history", "settings",
      "root", "ls", "cd", "tree", "find", "stat", "mkdir", "rm", "cp", "mv",
      "read", "write", "edit", "review", "test", "document", "refactor",
      "metrics", "scaffold", "git", "commit", "session", "snippet", "brain",
      "grep", "todo", "deps", "usage", "@", "role"
    ].includes(cmd)) {
      await handleAsk(line, rl);
      continue;
    }

    lastCommand = cmd;

    try {
      // Alias resolution
      if (settings.aliases && settings.aliases[cmd]) {
        const expansion = settings.aliases[cmd];
        console.log(`${c.dim}➜ Alias: ${cmd} -> ${expansion}${c.reset}`);
        const parts = expansion.split(" ");
        cmd = parts[0];
        rest = [...parts.slice(1), ...rest];
      }

      if (cmd === "quit" || cmd === "exit") {
        console.log(`\n${c.brightCyan}👋 Thanks for using Perplexity CLI Agent!${c.reset}\n`);
        break;
      }
      else if (cmd === "help") help(settings.model, getRoot());
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
        console.log(`${c.green}✓${c.reset} Conversation cleared\n`);
      }
      else if (cmd === "history") showHistory(conversationHistory);
      else if (cmd === "settings") {
        if (rest[0] === "set" && rest.length >= 3) {
          const key = rest[1];
          const value = rest.slice(2).join(" ");
          const boolVal = value.toLowerCase() === "true";

          if (key === "model") settings.model = value;
          else if (key === "temperature") settings.temperature = Math.min(1, Math.max(0, parseFloat(value)));
          else if (key === "editTemp") settings.editTemp = Math.min(1, Math.max(0, parseFloat(value)));
          else if (key === "maxHistory") settings.maxHistory = parseInt(value);
          else if (key === "maxFilesPerQuery") settings.maxFilesPerQuery = parseInt(value);
          else if (key === "colorScheme") settings.colorScheme = value;
          else if (["autoContext", "syntax", "askPermission", "autoSuggest", "gitIntegration",
            "conversationalMode", "smartFileDetection", "showFilePreview", "autoSave",
            "verbose", "compactMode", "showTimestamps", "autoCommit", "autoFormat",
            "cacheResponses", "streamingMode", "debugMode", "quietMode", "smartContext",
            "deepAnalysis"].includes(key)) {
            settings[key] = boolVal;
          } else {
            console.log(`${c.red}✗${c.reset} Unknown setting: ${c.yellow}${key}${c.reset}\n`);
            continue;
          }

          await saveSettings(settings);
          console.log(`${c.green}✓${c.reset} ${c.cyan}${key}${c.reset} = ${c.yellow}${value}${c.reset}\n`);
        } else {
          showSettings(settings);
        }
      }
      else if (cmd === "root") console.log(`${c.brightCyan}📍${c.reset} ${c.yellow}${getRoot()}${c.reset}\n`);
      else if (cmd === "ls") await listDir(rest.join(" ") || ".", settings);
      else if (cmd === "cd") {
        const target = rest.join(" ");
        if (!target) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}cd${c.reset} ${c.dim}<directory>${c.reset}\n`);
          continue;
        }
        setRoot(safePath(target));
        console.log(`${c.green}✓${c.reset} Changed to ${c.cyan}${getRoot()}${c.reset}\n`);
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
        if (!rest.length) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}stat${c.reset} ${c.dim}<path>${c.reset}\n`);
          continue;
        }
        await stat(rest.join(" "));
      }
      else if (cmd === "mkdir") {
        if (!rest.length) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}mkdir${c.reset} ${c.dim}<directory>${c.reset}\n`);
          continue;
        }
        await mkdir(rest.join(" "));
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
        if (!rest.length) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}read${c.reset} ${c.dim}<file>${c.reset}\n`);
          continue;
        }
        await readFile(rest.join(" "), settings);
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
        const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: settings.editTemp, settings });
        stopSpinner();

        console.log(`\n${c.bold}${c.yellow}━━ Proposed Changes ━━${c.reset}\n`);
        showDiff(original, text);
        console.log(`\n${c.bold}${c.yellow}━━━━━━━━━━━━━━━━━━${c.reset}\n`);

        const confirm = (await rl.question(`${c.cyan}Save?${c.reset} ${c.dim}(y/n)${c.reset}: `)).trim().toLowerCase();
        if (confirm === "y" || confirm === "yes") {
          await writeFile(file, text);
          console.log(`${c.green}✓${c.reset} Saved ${c.cyan}${file}${c.reset}\n`);
        }
      }
      else if (cmd === "review") {
        if (!rest.length) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}review${c.reset} ${c.dim}<file>${c.reset}\n`);
          continue;
        }
        await reviewCode(rest.join(" "), settings);
      }
      else if (cmd === "test") {
        const file = rest.join(" ");
        if (!file) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}test${c.reset} ${c.dim}<file>${c.reset}\n`);
          continue;
        }
        const testCode = await generateTests(file, settings);
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
        const docCode = await generateDocs(file, settings);
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
        const refactoredCode = await refactorCode(file, settings);
        console.log(`\n${c.bold}${c.brightYellow}♻️  Refactored Code${c.reset}\n`);
        console.log(formatResponse(refactoredCode.slice(0, 500) + "..."));
        console.log();

        const save = (await rl.question(`${c.cyan}Save?${c.reset} ${c.dim}(y/n)${c.reset}: `)).trim().toLowerCase();
        if (save === "y" || save === "yes") {
          await writeFile(file, refactoredCode);
          console.log(`${c.green}✓${c.reset} Saved ${c.cyan}${file}${c.reset}\n`);
        }
      }
      else if (cmd === "metrics") {
        if (!rest.length) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}metrics${c.reset} ${c.dim}<file>${c.reset}\n`);
          continue;
        }
        await codeMetrics(rest.join(" "));
      }
      else if (cmd === "scaffold") {
        if (rest.length < 2) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}scaffold${c.reset} ${c.dim}<type> <name>${c.reset}\n`);
          continue;
        }
        const { filename, content } = await scaffold(rest[0], rest[1], settings);
        console.log(`\n${c.bold}${c.yellow}━━ ${filename} ━━${c.reset}\n`);
        console.log(content);
        console.log(`\n${c.bold}${c.yellow}━━━━━━━━━━━━${c.reset}\n`);

        const save = (await rl.question(`${c.cyan}Save as ${filename}?${c.reset} ${c.dim}(y/n)${c.reset}: `)).trim().toLowerCase();
        if (save === "y" || save === "yes") {
          await writeFile(filename, content);
          console.log(`${c.green}✓${c.reset} Created ${c.cyan}${filename}${c.reset}\n`);
        }
      }
      else if (cmd === "git") {
        if (rest[0] === "status") {
          const status = getGitStatus();
          if (status) console.log(`\n${c.bold}${c.brightCyan}🔀 Git Status${c.reset}\n${status}`);
          else console.log(`${c.yellow}⚠${c.reset} Not a git repository\n`);
        } else if (rest[0] === "diff") {
          const diff = getGitDiff();
          if (diff) console.log(`\n${c.bold}${c.brightCyan}🔀 Git Diff${c.reset}\n${diff.slice(0, 1000)}${diff.length > 1000 ? "\n..." : ""}`);
          else console.log(`${c.yellow}⚠${c.reset} No changes\n`);
        } else if (rest[0] === "log") {
          const log = getGitLog();
          if (log) console.log(`\n${c.bold}${c.brightCyan}📜 Git Log${c.reset}\n${log}\n`);
          else console.log(`${c.yellow}⚠${c.reset} Not a git repository\n`);
        }
      }
      else if (cmd === "commit") await generateCommitMessage(settings);
      else if (cmd === "session") {
        if (rest[0] === "save" && rest[1]) await saveSession(rest[1], conversationHistory, settings);
        else if (rest[0] === "load" && rest[1]) {
          const session = await loadSession(rest[1]);
          if (session) {
            conversationHistory = session.history || [];
            setRoot(session.root || getRoot());
          }
        }
        else if (rest[0] === "list") await listSessions();
        else console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}session save/load/list <name>${c.reset}\n`);
      }
      else if (cmd === "snippet") {
        if (rest[0] === "save" && rest[1]) {
          const code = await pasteMultiline(rl);
          await saveSnippet(rest[1], code, snippetsLibrary);
        }
        else if (rest[0] === "get" && rest[1]) {
          const code = loadSnippet(rest[1], snippetsLibrary);
          if (code) console.log(`\n${c.bold}${c.brightCyan}✂️  ${rest[1]}${c.reset}\n${code}\n`);
        }
        else if (rest[0] === "list") listSnippets(snippetsLibrary);
        else console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}snippet save/get/list <name>${c.reset}\n`);
      }
      else if (cmd === "brain") {
        if (rest[0] === "init") projectBrain = await initBrain();
        else if (rest[0] === "show") showBrain(projectBrain);
        else if (rest[0] === "update") projectBrain = await updateBrain(projectBrain, settings);
        else console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}brain init/show/update${c.reset}\n`);
      }
      else if (cmd === "grep") {
        const pattern = rest.join(" ");
        if (!pattern) {
          console.log(`${c.yellow}⚠${c.reset} Usage: ${c.cyan}grep${c.reset} ${c.dim}<pattern>${c.reset}\n`);
          continue;
        }
        startSpinner("Searching");
        const matches = await grepProject(pattern);
        stopSpinner();

        if (matches.length > 0) {
          console.log(`\n${c.bold}${c.green}🔍 Found ${matches.length} matches${c.reset}\n`);
          matches.slice(0, 50).forEach(m => {
            console.log(`  ${c.cyan}${m.file}${c.reset}:${c.yellow}${m.line}${c.reset}  ${c.dim}${m.content}${c.reset}`);
          });
          if (matches.length > 50) console.log(`  ${c.dim}...and ${matches.length - 50} more${c.reset}`);
          console.log();
        } else {
          console.log(`${c.yellow}⚠${c.reset} No matches found\n`);
        }
      }
      else if (cmd === "todo") {
        startSpinner("Scanning TODOs");
        const todos = await scanTodos();
        stopSpinner();

        if (todos.length > 0) {
          console.log(`\n${c.bold}${c.brightMagenta}📝 Project Tasks${c.reset}\n`);
          todos.forEach(t => console.log(`  ${c.cyan}${t.file}${c.reset}:${c.yellow}${t.line}${c.reset} ${t.content}`));
          console.log();
        } else {
          console.log(`${c.green}✓${c.reset} No TODOs found!\n`);
        }
      }
      else if (cmd === "deps") {
        const deps = await analyzeDeps();
        if (deps) {
          console.log(`\n${c.bold}${c.blue}📦 Dependencies${c.reset}\n`);
          console.log(`${c.bold}Production:${c.reset}`);
          Object.keys(deps.dependencies).forEach(d => console.log(`  ${c.cyan}${d}${c.reset}: ${deps.dependencies[d]}`));
          console.log(`\n${c.bold}Dev:${c.reset}`);
          Object.keys(deps.devDependencies).forEach(d => console.log(`  ${c.cyan}${d}${c.reset}: ${deps.devDependencies[d]}`));
          console.log();
        } else {
          console.log(`${c.yellow}⚠${c.reset} No package.json found\n`);
        }
      }
      else if (cmd === "usage") {
        console.log(`\n${c.bold}${c.brightBlue}📊 Token Usage (Est.)${c.reset}\n`);
        console.log(`  Prompt Tokens:     ${c.yellow}${Math.round(usageStats.prompt_tokens)}${c.reset}`);
        console.log(`  Completion Tokens: ${c.yellow}${Math.round(usageStats.completion_tokens)}${c.reset}`);
        console.log(`  Total Cost:        ${c.green}$${usageStats.cost.toFixed(4)}${c.reset}\n`);
      }
      else if (cmd === "role") {
        const role = rest.join(" ");
        if (!role) {
          console.log(`\n${c.bold}${c.brightMagenta}🎭 Current Role:${c.reset} ${settings.role || "(Default AI)"}\n`);
        } else {
          if (role === "clear" || role === "reset") settings.role = "";
          else settings.role = role;
          await saveSettings(settings);
          console.log(`${c.green}✓${c.reset} Role set to: ${c.magenta}${settings.role || "Default"}${c.reset}\n`);
        }
      }
      else {
        console.log(`${c.red}✗${c.reset} Unknown: ${c.yellow}${cmd}${c.reset}`);
        console.log(`${c.dim}Try${c.reset} ${c.cyan}help${c.reset}\n`);
      }
    } catch (e) {
      lastError = e;
      console.error(`${c.red}✗ Error:${c.reset} ${e?.message ?? String(e)}\n`);
    }
  }

  rl.close();
}

main().catch(err => {
  console.error(`${c.red}Fatal: ${err.message}${c.reset}`);
  process.exit(1);
});
