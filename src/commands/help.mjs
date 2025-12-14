
import { c } from "../ui/colors.mjs";
import { help as showHelp } from "../ui/help.mjs";

export const meta = {
  name: "help",
  description: "Show help menu",
  usage: "/help"
};

export async function execute(args, context) {
  showHelp(context.settings.model || "sonar-pro", context.root || process.cwd());
}
