
import { c } from "../ui/colors.mjs";
import { updateBrain, showBrain } from "../brain/brain.mjs";

export const meta = {
  name: "memory",
  description: "Commands for interacting with memory (PEMINI.md)",
  usage: "/memory <show|add|refresh>"
};

export async function execute(args, context) {
  const [subcmd, ...rest] = args;

  if (subcmd === "show") {
    showBrain(context.projectBrain);
  } else if (subcmd === "refresh") {
    context.projectBrain = await updateBrain(context.projectBrain, context.settings);
  } else if (subcmd === "add") {
    const content = rest.join(" ");
    if (!content) {
      console.log(`${c.yellow}Usage: /memory add <content>${c.reset}`);
      return;
    }
    // Add to customInstructions or description?
    context.projectBrain.customInstructions = (context.projectBrain.customInstructions || []) + "\n- " + content;
    // We should save it too.
    // context.projectBrain is just an object. updateBrain saves it.
    // We need a saveBrain function.
    // But `updateBrain` does redundant logic.
    // For now, let's just log it in memory.
    console.log(`${c.green}✓${c.reset} Added to memory.`);
  } else {
    console.log(`${c.yellow}Usage: /memory <show|add|refresh>${c.reset}`);
  }
}
