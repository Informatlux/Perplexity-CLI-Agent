
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "terminal-setup",
  description: "Configure terminal keybindings",
  usage: "/terminal-setup"
};

export async function execute(args, context) {
  console.log(`
${c.bold}Terminal Integration Guide${c.reset}

To get the best experience:
1. ${c.cyan}VS Code:${c.reset} Install 'Perplexity' extension.
2. ${c.cyan}Windsurf:${c.reset} Use 'Term' integration logic.

${c.dim}(This command is a placeholder for future auto-configuration script)${c.reset}
`);
}
