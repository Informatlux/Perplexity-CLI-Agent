
import { c } from "../ui/colors.mjs";
import { saveSettings } from "../config/settings.mjs";

export const meta = {
  name: "model",
  description: "Opens a dialog to configure the model",
  usage: "/model [name]"
};

export async function execute(args, context) {
  const model = args[0];
  if (model) {
    context.settings.model = model;
    await saveSettings(context.settings);
    console.log(`${c.green}✓${c.reset} Model set to ${c.yellow}${model}${c.reset}`);
  } else {
    console.log(`${c.bold}Current Model:${c.reset} ${c.yellow}${context.settings.model}${c.reset}`);
    console.log(`\n${c.dim}Available Models:${c.reset}`);
    console.log(`  ${c.cyan}sonar-pro${c.reset}      (Best for coding)`);
    console.log(`  ${c.cyan}sonar-reasoning${c.reset} (Best for logic)`);
    console.log(`  ${c.cyan}sonar${c.reset}           (Fast)`);
    console.log(`\n${c.dim}Usage: /model <name>${c.reset}`);
  }
}
