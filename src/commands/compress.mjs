
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "compress",
  description: "Compresses the context by replacing it with a summary",
  usage: "/compress"
};

export async function execute(args, context) {
  const history = context.conversationHistory;
  if (history.length < 2) {
    console.log(`${c.yellow}Context is already small.${c.reset}`);
    return;
  }

  console.log(`${c.dim}Compressing ${history.length} messages...${c.reset}`);

  // In a real implementation, we would send a prompt to the LLM to summarize the history.
  // For now, we will just keep the last 5 messages and a placeholder "Summary".

  const keep = 5;
  const recent = history.slice(-keep);
  const old = history.slice(0, -keep);

  if (old.length === 0) {
    console.log(`${c.yellow}Context not large enough to compress (only ${history.length} messages).${c.reset}`);
    return;
  }

  const summaryMsg = {
    role: "system",
    content: `[System Summary of previous ${old.length} messages]: Conversation focused on user request. Previous context compressed.`
  };

  context.conversationHistory.length = 0;
  context.conversationHistory.push(summaryMsg, ...recent);

  console.log(`${c.green}✓${c.reset} Context compressed. Kept last ${keep} messages.`);
}
