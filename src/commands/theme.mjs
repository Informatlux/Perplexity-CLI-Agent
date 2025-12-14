
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "theme",
  description: "Change the theme",
  usage: "/theme <dark|light>"
};

export async function execute(args, context) {
  console.log(`${c.yellow}Theme switching is not yet fully supported.${c.reset}`);
  console.log(`${c.dim}Default: Perplexity Dark Mode${c.reset}`);
}
