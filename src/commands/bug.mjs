
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "bug",
  description: "Submit a bug report",
  usage: "/bug"
};

export async function execute(args, context) {
  console.log(`${c.bold}${c.brightRed}🐛 Found a bug?${c.reset}`);
  console.log(`${c.dim}Please report it on our GitHub repository:${c.reset}`);
  console.log(`${c.cyan}https://github.com/google-deepmind/perplexity-cli-agent/issues${c.reset}\n`);

  // Future: Open link automatically?
  // import { open } from 'open'; // if available
}
