
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "vim",
  description: "Toggle vim mode on/off",
  usage: "/vim"
};

export async function execute(args, context) {
  context.settings.vimMode = !context.settings.vimMode;
  const status = context.settings.vimMode ? c.green + "ON" : c.red + "OFF";
  console.log(`${c.bold}Vim Mode:${c.reset} ${status}`);
  if (context.settings.vimMode) {
    console.log(`${c.dim}(Note: Limited support via node readline)${c.reset}`);
  }
}
