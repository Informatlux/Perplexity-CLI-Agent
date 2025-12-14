import path from "node:path";
import { c } from "./colors.mjs";

export function help(MODEL, ROOT) {
  const teal = c.cyan; // Perplexity primary
  const dim = c.dim;
  const reset = c.reset;
  const bold = c.bold;
  const white = c.white;

  // Helper for "Command - Description"
  const row = (cmd, desc, sub = "") => {
    return `  ${teal}${cmd.padEnd(20)}${reset} ${desc} ${sub ? dim + sub + reset : ""}`;
  };

  // Helper for "Key - Description"
  const keyRow = (key, desc) => {
    return `  ${c.yellow}${key.padEnd(20)}${reset} ${desc}`;
  };

  console.log(`
${bold}${white}Basics:${reset}
${dim}Add context:${reset} Use ${teal}@${reset} to specify files (e.g., ${teal}@src/main.js${reset}).
${dim}Shell mode:${reset}  Execute shell commands via ${teal}!${reset} (e.g., ${teal}!npm test${reset}).

${bold}${white}Commands:${reset}
${row("/ask <prompt>", "Chat with AI (reads code!)")}
${row("/read <file>", "Read file with highlighting")}
${row("/edit <file>", "AI-powered file editing")}
${row("/review <file>", "AI code review")}
${row("/ls, /cd", "List / Change directory")}
${row("/git <cmd>", "Run git commands")}
${row("/chat", "Manager chat sessions", "(save, load, list, clear)")}
${row("/compress", "Compress context window")}
${row("/copy", "Copy last AI response")}
${row("/stats", "Show token usage & cost")}
${row("/mcp", "Manage MCP servers")}
${row("/memory", "Manage project brain")}
${row("/extensions", "Manage extensions")}
${row("/setup-github", "Generate CI workflow")}
${row("/terminal-setup", "Keybinding setup help")}
${row("/auth, /bug, /docs", "Auth, Report Bug, Docs")}
${row("/about, /privacy", "Version & Privacy info")}
${row("/settings", "View and edit settings")}
${row("/quit", "Exit the CLI")}

${bold}${white}Keyboard Shortcuts:${reset}
${keyRow("Alt+Left/Right", "Jump words (terminal default)")}
${keyRow("Ctrl+C", "Cancel / Quit (double press)")}
${keyRow("Ctrl+L", "Clear the screen")}
${keyRow("Ctrl+S", "Enter selection mode (if supported)")}
${keyRow("Ctrl+X", "Open in external editor")}
${keyRow("Ctrl+Y", "Toggle YOLO mode (auto-run)")}
${keyRow("PageUp/Down", "Scroll history")}

${dim}For a full list of features, say "ask what can you do?"${reset}
`);
}

export function showSettings(settings) {
  const bool = (val) => val ? c.green + "ON" : c.red + "OFF";

  console.log(`
${c.bold}Configuration:${c.reset}

${c.cyan}/model${c.reset}        ${c.yellow}${settings.model}${c.reset}
${c.cyan}/history${c.reset}      ${c.yellow}${settings.maxHistory}${c.reset} msgs
${c.cyan}/temp${c.reset}         ${c.yellow}${settings.temperature}${c.reset}

${c.bold}Flags:${c.reset}
${c.dim}Suggestion:${c.reset}   ${bool(settings.autoSuggest)}
${c.dim}Permission:${c.reset}   ${bool(settings.askPermission)}
${c.dim}Verbose:${c.reset}      ${bool(settings.verbose)}
  `);
}

export async function pasteMultiline(rl) {
  console.log(`${c.dim}Paste content. End with${c.reset} ${c.yellow}::end${c.reset}\n`);
  const lines = [];
  while (true) {
    const line = await rl.question("");
    if (line.trim() === "::end") break;
    lines.push(line);
  }
  return lines.join("\n");
}

export function suggestNextAction(cmd, settings) {
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

export function showHistory(conversationHistory) {
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
