
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "ide",
  description: "Manage IDE integration",
  usage: "/ide"
};

export async function execute(args, context) {
  console.log(`${c.bold}${c.brightMagenta}IDE Integration${c.reset}`);
  console.log(`${c.dim}VS Code Extension: ${c.green}Installed${c.reset}`);
  console.log(`${c.dim}JetBrains Plugin: ${c.red}Not Installed${c.reset}`);
  console.log(`\nRun ${c.cyan}/terminal-setup${c.reset} to configure keybindings.`);
}
