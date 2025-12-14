
import { c } from "../ui/colors.mjs";
import os from "os";

export const meta = {
  name: "quit",
  description: "Exit the session with a summary",
  usage: "/quit"
};

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.ceil(seconds % 60);

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};

export async function execute(args, context) {
  const uptime = process.uptime();
  // Use randomUUID from global or crypto
  const sessionID = crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2));

  // Mock Metrics (since we don't track them granularly yet)
  const toolCalls = context.toolUsage?.total || 0;
  const toolSuccess = context.toolUsage?.success || 0;
  const toolFail = context.toolUsage?.failed || 0;
  const rate = toolCalls > 0 ? ((toolSuccess / toolCalls) * 100).toFixed(1) : "0.0";

  const width = process.stdout.columns || 80;
  const boxWidth = Math.min(width - 4, 70);
  const lineChar = "─";
  const topBorder = `╭${lineChar.repeat(boxWidth - 2)}╮`;
  const botBorder = `╰${lineChar.repeat(boxWidth - 2)}╯`;

  console.log("");
  console.log(`  ${c.pplx.teal}${topBorder}${c.reset}`);

  // Content Helper
  const printLine = (str, colorWrapper = (s) => s) => {
    // Remove ansi for length calc
    // This is a rough estimation if colorWrapper adds ansi
    const visibleLen = str.replace(/\x1B\[[0-9;]*[mK]/g, '').length;
    const pad = boxWidth - 2 - visibleLen - 2; // -2 for margins
    console.log(`  ${c.pplx.teal}│${c.reset}  ${colorWrapper(str)}${" ".repeat(Math.max(0, pad))}${c.pplx.teal}│${c.reset}`);
  };

  const printPair = (label, value) => {
    // label + spacing + value
    // Fixed chars: │(1) + "  "(2) ... "  "(2) + │(1) = 6 chars overhead
    const labelLen = label.length;
    const valLen = value.replace(/\x1B\[[0-9;]*[mK]/g, '').length;
    const space = Math.max(0, boxWidth - 6 - labelLen - valLen);
    console.log(`  ${c.pplx.teal}│${c.reset}  ${c.bold}${label}${c.reset}${" ".repeat(space)}${value}  ${c.pplx.teal}│${c.reset}`);
  };

  printLine("");
  printLine("Agent powering down. Goodbye!", (s) => `${c.bold}${c.pplx.teal}${s}${c.reset}`);
  printLine("");

  printLine("Interaction Summary", (s) => `${c.bold}${c.white}${s}${c.reset}`);
  printPair("Session ID:", `${c.dim}${sessionID}${c.reset}`);
  printPair("Tool Calls:", `${c.yellow}${toolCalls}${c.reset} ( ${c.green}√ ${toolSuccess}${c.reset} ${c.red}x ${toolFail}${c.reset} )`);
  printPair("Success Rate:", `${c.pplx.teal}${rate}%${c.reset}`);
  printLine("");

  printLine("Performance", (s) => `${c.bold}${c.white}${s}${c.reset}`);
  printPair("Wall Time:", `${c.white}${formatTime(uptime)}${c.reset}`);
  printPair("Agent Active:", `${c.dim}0s${c.reset}`);
  printPair(" » API Time:", `${c.dim}0s (0.0%)${c.reset}`);
  printPair(" » Tool Time:", `${c.dim}0s (0.0%)${c.reset}`);

  printLine("");
  console.log(`  ${c.pplx.teal}${botBorder}${c.reset}\n`);

  process.exit(0);
}
