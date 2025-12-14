
import { c } from "../ui/colors.mjs";
import { saveSettings } from "../config/settings.mjs";

export const meta = {
  name: "editor",
  description: "Set external editor preference",
  usage: "/editor <vim|nano|code|...>"
};

export async function execute(args, context) {
  const editor = args[0];
  if (!editor) {
    console.log(`${c.bold}Current Editor:${c.reset} ${c.cyan}${context.settings.editor || "System Default"}${c.reset}`);
    console.log(`${c.dim}Usage: /editor <command>${c.reset}`);
    return;
  }

  context.settings.editor = editor;
  await saveSettings(context.settings);
  console.log(`${c.green}✓${c.reset} Editor set to: ${c.cyan}${editor}${c.reset}`);
}
