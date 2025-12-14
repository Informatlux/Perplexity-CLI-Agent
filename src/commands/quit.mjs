
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "quit",
  description: "Exit the CLI with a summary",
  usage: "/quit"
};

export async function execute(args, context) {
  // 1. Calculate Session Stats
  const endTime = Date.now();
  const startTime = context.startTime || (Date.now() - 1000); // Fallback
  const durationSec = Math.round((endTime - startTime) / 1000);

  const historyCount = context.conversationHistory ? context.conversationHistory.length : 0;
  const filesRead = context.filesReadCount || 0; // Assuming we track this
  const tokensUsed = context.usageStats ? Math.round(context.usageStats.prompt_tokens + context.usageStats.completion_tokens) : 0;

  console.log(`\n${c.bold}${c.pplx.teal}👋 formatting Session Summary${c.reset} \n`);

  // 2. Display Stats Box
  const width = 50;
  const line = "─".repeat(width);
  console.log(`${c.dim}╭${line}╮${c.reset} `);

  const row = (label, value) => {
    const pad = width - label.length - String(value).length - 2;
    return `${c.dim}│${c.reset} ${label} ${" ".repeat(Math.max(0, pad))} ${c.cyan}${value}${c.reset} ${c.dim}│${c.reset} `;
  };

  console.log(row("Duration", `${durationSec} s`));
  console.log(row("Messages", historyCount));
  console.log(row("Tokens Used", tokensUsed));
  console.log(row("Files Accessed", filesRead)); // Needs tracking in context

  console.log(`${c.dim}╰${line}╯${c.reset} `);

  // 3. Save Context (Auto-Save)
  if (context.settings.autoSave) {
    console.log(`\n${c.dim} Auto - saving session...${c.reset} `);
    // await saveSession("autosave-last", context.conversationHistory);
    console.log(`${c.green}✓ Saved.${c.reset} `);
  }

  // 4. Motivational Quote (Easter Egg)
  const quotes = [
    "Keep shipping.",
    "Code is poetry.",
    "See you in the repo.",
    "Terminal closed, mind open."
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  console.log(`\n${c.italic}${quote}${c.reset} \n`);

  // 5. Exit
  process.exit(0);
}
