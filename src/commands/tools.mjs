
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "tools",
  description: "List available Gemini CLI tools",
  usage: "/tools"
};

export async function execute(args, context) {
  console.log(`\n${c.bold}Available Tools:${c.reset}`);
  const tools = [
    "read_file", "write_file", "list_dir", "grep_project", "scan_todos",
    "analyze_deps", "review_code", "generate_tests", "generate_docs",
    "refactor_code", "scaffold_project"
  ];

  tools.forEach(t => console.log(`  ${c.cyan}${t}${c.reset}`));
  console.log();
}
