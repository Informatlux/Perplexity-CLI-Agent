import path from "node:path";
import { c } from "./colors.mjs";

export function help(MODEL, ROOT) {
  console.log(`
${c.bold}${c.brightCyan}╭─────────────────────────────────────────────────────────────╮${c.reset}
${c.bold}${c.brightCyan}│${c.reset}  ${c.bold}${c.brightMagenta}✨ Perplexity CLI Agent${c.reset} ${c.dim}v5 Ultimate${c.reset}                  ${c.bold}${c.brightCyan}│${c.reset}
${c.bold}${c.brightCyan}╰─────────────────────────────────────────────────────────────╯${c.reset}

${c.bold}${c.brightCyan}📍 Root:${c.reset} ${c.yellow}${path.basename(ROOT)}${c.reset}  ${c.bold}${c.brightCyan}🤖 Model:${c.reset} ${c.yellow}${MODEL}${c.reset}

${c.bold}${c.brightMagenta}━━ 💬 AI Chat ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
  ${c.cyan}ask${c.reset} ${c.dim}<prompt>${c.reset}              Chat with AI (reads code!)
  ${c.cyan}role${c.reset} ${c.dim}<persona>${c.reset}             Set AI persona
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
  ${c.cyan}grep${c.reset} ${c.dim}<pattern>${c.reset}             Search in files
  ${c.cyan}todo${c.reset}                        List TODOs
  ${c.cyan}deps${c.reset}                        Analyze dependencies
  
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
  ${c.cyan}session save${c.reset} ${c.dim}<n>${c.reset}        Save session
  ${c.cyan}session load${c.reset} ${c.dim}<n>${c.reset}        Load session
  ${c.cyan}session list${c.reset}                List sessions
  ${c.cyan}snippet save${c.reset} ${c.dim}<n>${c.reset}        Save snippet
  ${c.cyan}snippet get${c.reset} ${c.dim}<n>${c.reset}         Get snippet
  ${c.cyan}snippet list${c.reset}                List snippets
  
${c.bold}${c.brightMagenta}━━ 🧠 Project Brain ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
  ${c.cyan}brain init${c.reset}                  Initialize/Reset brain
  ${c.cyan}brain update${c.reset}                Auto-update brain
  ${c.cyan}brain show${c.reset}                  Show brain status

${c.bold}${c.yellow}━━ ⚙️  System ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
  ${c.cyan}settings${c.reset}                    View config
  ${c.cyan}settings set${c.reset} ${c.dim}<k> <v>${c.reset}       Update setting
  ${c.cyan}root${c.reset}                        Show root
  ${c.cyan}usage${c.reset}                       Show token usage
  ${c.cyan}help${c.reset}                        This help
  ${c.cyan}quit${c.reset}                        Exit

${c.dim}💡 Try:${c.reset} ${c.cyan}ask "what does this app do?"${c.reset}
  `);
}

export function showSettings(settings) {
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
${c.dim}Verbose:${c.reset}            ${bool(settings.verbose)}${c.reset}

${c.bold}${c.green}━━ Smart Features ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
${c.dim}Smart File Detection:${c.reset} ${bool(settings.smartFileDetection)}${c.reset}
${c.dim}Auto Context:${c.reset}       ${bool(settings.autoContext)}${c.reset}
${c.dim}Smart Context:${c.reset}      ${bool(settings.smartContext)}${c.reset}
${c.dim}Deep Analysis:${c.reset}      ${bool(settings.deepAnalysis)}${c.reset}
${c.dim}Ask Permission:${c.reset}     ${bool(settings.askPermission)}${c.reset}
${c.dim}Max Files/Query:${c.reset}    ${c.yellow}${settings.maxFilesPerQuery}${c.reset}

${c.dim}Usage:${c.reset} ${c.cyan}settings set${c.reset} ${c.yellow}<key> <value>${c.reset}
${c.dim}Models: sonar-pro, sonar-reasoning, sonar${c.reset}
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
