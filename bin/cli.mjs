#!/usr/bin/env node

import readline from "node:readline/promises";
import { emitKeypressEvents } from "node:readline";
import process from "node:process";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import os from "node:os";

// Helper for UI calculation
const stripAnsi = (str) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
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

// Command Dispatcher
import { handleCommand, getCommands } from "../src/commands/index.mjs";

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

    // Ctrl+L: Clear Screen
    if (key.ctrl && key.name === 'l') {
      console.clear();
      // We might need to reprint prompt?
      // Since we are in a loop, clearing screen might mess up position if we don't redraw.
      // But we are at `readline` prompt.
      // Ideally we trigger a redraw.
    }

    // Ctrl+Y: Toggle YOLO Mode
    if (key.ctrl && key.name === 'y') {
      settings.yoloMode = !settings.yoloMode;
      console.log(`\n${c.dim}YOLO Mode: ${settings.yoloMode ? c.green + "ON" : c.red + "OFF"}${c.reset}`);
      // Save?
      // saveSettings(settings); 
    }

    // Ctrl+X: External Editor (Stub)
    if (key.ctrl && key.name === 'x') {
      console.log(`\n${c.dim}Opening external editor... (Not fully implemented yet)${c.reset}`);
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
    const boxWidth = Math.max(20, width - 2);
    const lineChar = "─";

    // Status Bar Data
    const cwd = path.relative(os.homedir(), process.cwd()) || "~";
    const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const contextUsage = "0%"; // Todo: calculate real token usage
    const model = settings.model || "auto";

    // --- Live Autocomplete Logic ---
    const commands = getCommands();
    const cmdList = Object.values(commands).map(mod => mod.meta).filter(Boolean); // { name, description, usage }

    const topBorder = `${c.pplx.teal}╭${lineChar.repeat(boxWidth - 2)}╮${c.reset}`;
    const botBorder = `${c.pplx.teal}╰${lineChar.repeat(boxWidth - 2)}╯${c.reset}`;

    // Status Lines
    // L1: ~                                                no sandbox (see /docs)
    // L2:                                                  auto (100% context left) | 131.4 MB

    const statusL1Left = `${c.dim}${cwd}${c.reset}`;
    const statusL1Right = `${c.dim}no sandbox (see /docs)${c.reset}`;
    const paddingL1 = width - 2 - cwd.length - 22; // 22 is ~ length of right string
    const statusLine1 = " " + statusL1Left + " ".repeat(Math.max(0, paddingL1)) + statusL1Right;

    const statusL2Right = `${c.dim}${model} (100% context left) | ${mem} MB${c.reset}`;
    const paddingL2 = width - 2 - stripAnsi(statusL2Right).length;
    const statusLine2 = " " + " ".repeat(Math.max(0, paddingL2)) + statusL2Right;

    // Render Box & Status
    console.log(topBorder);
    console.log(" "); // Middle (Prompt line)
    console.log(botBorder);
    console.log(statusLine1);
    console.log(statusLine2);

    // Initial Cursor Position: Up 4 lines (Status2, Status1, BotBorder, Middle)
    process.stdout.write('\x1B[4A');

    // Prompt
    const prompt = `${c.pplx.teal}│${c.reset} ${c.bold}${c.pplx.white || c.white}>${c.reset} `;

    // --- Live Autocomplete Logic ---
    const keypressHandler = () => {
      // Wait for rl to update 'line'
      setTimeout(() => {
        const input = rl.line;

        // Only trigger if line starts with /
        if (input.startsWith("/")) {
          const query = input.slice(1).toLowerCase();
          const matches = cmdList.filter(cmd => cmd.name.startsWith(query));

          // Save Cursor
          process.stdout.write('\x1B[s');

          // Move down to Bottom Border (2 lines down from prompt)
          // Prompt line -> BotBorder -> Status1
          process.stdout.write('\x1B[2B');
          process.stdout.write('\x1B[1G'); // Start of line

          // Clear Down
          process.stdout.write('\x1B[0J');

          if (matches.length > 0) {
            // Render Suggestions
            const limit = 5;
            matches.slice(0, limit).forEach(cmd => {
              const namePadding = " ".repeat(12 - cmd.name.length);
              console.log(`${c.pplx.teal}${cmd.name}${c.reset}${namePadding} ${c.dim}${cmd.description}${c.reset}`);
            });
            if (matches.length > limit) {
              console.log(`${c.dim}(${matches.length} matches)${c.reset}`);
            }
          } else {
            // No match or just "/"
            // Maybe restore status bar? 
            // For now, keep empty to be clean "dropdown" style
          }

          // Restore Cursor
          process.stdout.write('\x1B[u');
        } else {
          // Not a command, ensure status bar is visible?
          // If we previously cleared it, we should redraw it.
          // This is tricky without "knowing" previous state.
          // Simplified: If not '/', we don't clear, assuming status bar is there.
          // But if user backspaced from '/', we need to PUT BACK the status bar.
          // For this iteration, let's just leave it blank if they typed '/' then deleted it, 
          // until they hit Enter (which refreshes loop).
          // Or: Redraw status bar if empty/not slash?
          if (input === "" || !input.includes("/")) {
            process.stdout.write('\x1B[s');
            process.stdout.write('\x1B[2B');
            process.stdout.write('\x1B[1G');
            process.stdout.write(botBorder + "\n" + statusLine1 + "\n" + statusLine2); // Poor man's redraw
            process.stdout.write('\x1B[u');
          }
        }
      }, 1);
    };

    process.stdin.on('keypress', keypressHandler);

    // Readline interaction
    let line = await rl.question(prompt);
    line = line.trim();

    // Clean up listener
    process.stdin.removeListener('keypress', keypressHandler);

    // CLEAR BOTTOM UI:
    // User hit enter, so cursor is now at the start of the line BELOW the input (The Bottom Border Line).
    // We want to erase everything from here down (Bottom Border + Status Lines).
    process.stdout.write('\x1B[0J'); // Clear screen from cursor down

    // We also want to close the box visually in history? 
    // If we clear the bottom border, it looks like an open-ended box in history:
    // ╭──────╮
    // │ > hi
    // (response)
    //
    // The user's request says "dont print the remaining bottom part". 
    // And "look like the image". The image SHOWS a bottom border in the "Active" state, but the second image shows just the top part for history?
    // Actually, normally CLI history is just text. 
    // If I leave the bottom border, it looks like a box.
    // If I remove it, it looks cleaner.
    // Let's stick to the "Clear Down" approach as it's the most standard "Transient UI" pattern.
    // BUT, we might want to print a simple "closing" line if we want it to look like a box in history.
    // Let's just do valid clearing first.

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


    try {
      let [cmd, ...rest] = line.split(" ");
      if (cmd.startsWith("/")) cmd = cmd; // keep slash for dispatcher? No, usually dispatcher takes name
      // actually my dispatcher takes full input string

      // Command Dispatcher
      // We pass the full line to handleCommand (it parses args)
      // We provide a context object with everything needed
      const context = {
        settings,
        rl,
        conversationHistory,
        projectBrain,
        snippetsLibrary,
        root: getRoot(),
        setRoot,
        usageStats,
        lastCommand,
        lastError,
        // Helper methods
        clearHistory: () => { conversationHistory = []; },
        printBanner: printGeminiStyleBanner,
      };

      // If it starts with / or is a known command, try dispatcher first
      if (line.startsWith("/")) {
        const handled = await handleCommand(line, context);
        if (handled) continue;
        // If not handled, fall through?
      }

      // Conversational mode logic (simplified)
      if (settings.conversationalMode && !line.startsWith("/")) {
        await handleAsk(line, rl);
        continue;
      }

      // Fallback if not conversational and not a slash command found, check if it matches a known command without slash
      // Or just treat as ask?
      // Current logic allowed "quit" without slash. Dispatcher expects "/quit" based on my registry? 
      // Wait, handleCommand splits string. It expects "/cmd".
      // I should normalize.

      let commandInput = line;
      if (!line.startsWith("/")) {
        // If standard command, prepend /
        const firstWord = line.split(" ")[0];
        const common = ["quit", "exit", "help", "clear", "ls", "cd"];
        if (common.includes(firstWord)) {
          commandInput = "/" + line;
        }
      }

      if (commandInput.startsWith("/")) {
        const handled = await handleCommand(commandInput, context);
        if (handled) continue;
      }

      // Default to ask if not empty
      if (line.trim()) {
        // If it looks like a command but wasn't handled
        if (line.startsWith("/")) {
          console.log(`${c.red}✗${c.reset} Unknown command: ${c.yellow}${line.split(" ")[0]}${c.reset}`);
          console.log(`${c.dim}Try${c.reset} ${c.cyan}/help${c.reset}\n`);
        } else {
          await handleAsk(line, rl);
        }
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
