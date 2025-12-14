
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "stats",
  description: "Check detailed session stats and resource usage",
  usage: "/stats [session|model|tools]"
};

export async function execute(args, context) {
  const stats = context.usageStats || { prompt_tokens: 0, completion_tokens: 0, cost: 0 };
  const history = context.conversationHistory || [];

  console.log(`\n${c.bold}${c.brightBlue}📊 Detailed Statistics${c.reset} \n`);

  // 1. Token Economics
  const promptTokens = Math.round(stats.prompt_tokens);
  const compTokens = Math.round(stats.completion_tokens);
  const totalTokens = promptTokens + compTokens;

  // Cost estimation (Roughly based on generic pricing if not provided by API)
  // Example: $5/1M input, $15/1M output for generic high-end
  const estimatedCost = stats.cost > 0 ? stats.cost : (promptTokens * 5 + compTokens * 15) / 1000000;

  console.log(`${c.bold}🪙 Token Usage${c.reset} `);
  console.log(`  ${c.dim} Prompt:${c.reset}      ${c.yellow}${promptTokens.toLocaleString()}${c.reset} tokens`);
  console.log(`  ${c.dim} Completion:${c.reset}  ${c.yellow}${compTokens.toLocaleString()}${c.reset} tokens`);
  console.log(`  ${c.dim} Total:${c.reset}       ${c.yellow}${totalTokens.toLocaleString()}${c.reset} tokens`);
  console.log(`  ${c.dim} Est.Cost:${c.reset}   ${c.green}$${estimatedCost.toFixed(6)}${c.reset} `);

  console.log();

  // 2. Conversation Depth
  console.log(`${c.bold}💬 Conversation${c.reset} `);
  const userMsgs = history.filter(m => m.role === 'user').length;
  const aiMsgs = history.filter(m => m.role === 'assistant').length;
  const sysMsgs = history.filter(m => m.role === 'system').length;

  console.log(`  ${c.dim} Turns:${c.reset}       ${userMsgs} User / ${aiMsgs} AI`);
  console.log(`  ${c.dim} Context:${c.reset}     ${sysMsgs} System prompts`);
  console.log(`  ${c.dim} Depth:${c.reset}       ${history.length} messages in buffer`);

  console.log();

  // 3. Performance Metrics (Simulated/Tracked)
  // Ideally 'context' would have 'metrics' object
  const metrics = context.metrics || { avgLatency: 0, lastRequest: 0 };

  if (metrics.avgLatency > 0) {
    console.log(`${c.bold}⚡ Performance${c.reset} `);
    console.log(`  ${c.dim}Avg Latency:${c.reset} ${metrics.avgLatency} ms`);
    console.log(`  ${c.dim}Last Req:${c.reset}    ${metrics.lastRequest} ms`);
  }

  // 4. Reset Option
  if (args[0] === "reset") {
    context.usageStats = { prompt_tokens: 0, completion_tokens: 0, cost: 0 };
    console.log(`\n${c.yellow}⚠ Stats have been reset.${c.reset} `);
  }
}
