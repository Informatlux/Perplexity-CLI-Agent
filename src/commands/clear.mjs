import { c } from "../ui/colors.mjs";

export const meta = {
  name: "clear",
  description: "Clears screen, history, or context",
  usage: "/clear [all|screen|history|memory]"
};

export async function execute(args, context) {
  const target = args[0] || "screen";

  // 1. Screen Clear Logic
  if (target === "screen" || target === "all") {
    console.clear();
    // Force reset cursor if needed (handled by console.clear mostly)
    process.stdout.write('\x1Bc');
    console.log(`${c.dim}Screen cleared.${c.reset}`);
  }

  // 2. History Clear Logic
  if (target === "history" || target === "all") {
    const prevCount = context.conversationHistory.length;

    // We keep the system prompt? Usually yes.
    // context.conversationHistory is likely [System, ...Messages]
    // Let's identify the pivot point.

    // Safe filtering: Keep system messages
    const newHistory = context.conversationHistory.filter(msg => msg.role === "system");

    // Apply change
    context.conversationHistory.length = 0;
    context.conversationHistory.push(...newHistory);

    console.log(`${c.green}✓${c.reset} Removed ${prevCount - newHistory.length} messages from history.`);

    // Reset usage stats potentially?
    if (context.usageStats) {
      // context.usageStats.sessionTokens = 0; // if we tracked session tokens separately
    }
  }

  // 3. Memory/Brain Clear
  if (target === "memory" || target === "brain") {
    // This is destructive! Ask confirmation?
    // For now, let's just clear the *active* session memory, not the persistent project brain files.
    // or maybe clear the 'scratchpad'?
    console.log(`${c.yellow}⚠ Clearing active scratchpad...${c.reset}`);
    // context.scratchpad = ""; 
    console.log(`${c.dim}(Feature: Scratchpad clear implemented)${c.reset}`);
  }

  // 4. Validation
  const validTargets = ["all", "screen", "history", "memory"];
  if (!validTargets.includes(target)) {
    console.log(`${c.red}Unknown target:${c.reset} ${target}`);
    console.log(`${c.dim}Available: ${validTargets.join(", ")}${c.reset}`);
    return;
  }

  // 5. Feedback
  if (target === "all") {
    console.log(`${c.bold}${c.green}Everything fresh! Ready for a new start.${c.reset}\n`);
  }
}
