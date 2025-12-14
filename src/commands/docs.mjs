
import { c } from "../ui/colors.mjs";
import { exec } from "child_process";

export const meta = {
  name: "docs",
  description: "Open full Gemini CLI documentation in your browser",
  usage: "/docs"
};

export async function execute(args, context) {
  const url = "https://github.com/google-deepmind/perplexity-cli-agent/blob/main/README.md"; // Placeholder URL
  console.log(`${c.dim}Opening documentation...${c.reset}`);

  // Start generic open command
  exec(`start ${url}`); // Windows specific 'start'
}
