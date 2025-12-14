
import { c } from "../ui/colors.mjs";
import { initBrain } from "../brain/brain.mjs";
import { analyzeProject } from "../project/analysis.mjs";

export const meta = {
  name: "init",
  description: "Analyzes the project and creates a tailored GEMINI.md file",
  usage: "/init"
};

export async function execute(args, context) {
  console.log(`${c.dim}Initializing project brain...${c.reset}`);

  // Re-analyze project
  const type = await analyzeProject();
  console.log(`${c.green}✓${c.reset} Detected type: ${c.yellow}${type}${c.reset}`);

  // Init brain
  context.projectBrain = await initBrain();
  console.log(`${c.green}✓${c.reset} Created GEMINI.md`);
}
