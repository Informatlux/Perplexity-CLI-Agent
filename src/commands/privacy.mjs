
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "privacy",
  description: "Display the privacy notice",
  usage: "/privacy"
};

export async function execute(args, context) {
  console.log(`
${c.bold}${c.brightCyan}🔒 Privacy Notice${c.reset}

1. ${c.bold}Local First:${c.reset} All your code stays on your machine unless you send it to the AI.
2. ${c.bold}API Usage:${c.reset} When you ask a question, relevant code snippets are sent to Perplexity API.
3. ${c.bold}No Training:${c.reset} Perplexity API data is not used for training (refer to Perplexity API terms).
4. ${c.bold}Keys:${c.reset} Your API key is stored locally in environment variables.

${c.dim}We respect your privacy and permissions.${c.reset}
`);
}
