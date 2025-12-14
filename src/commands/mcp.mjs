
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "mcp",
  description: "Manage configured Model Context Protocol (MCP) servers",
  usage: "/mcp <list|desc|schema|auth|refresh>"
};

export async function execute(args, context) {
  const [subcmd] = args;

  if (subcmd === "list") {
    console.log(`${c.bold}MCP Servers:${c.reset}`);
    console.log(`  ${c.dim}(No servers configured)${c.reset}`);
  } else {
    console.log(`${c.yellow}Usage: /mcp <list|desc|schema|auth|refresh>${c.reset}`);
  }
}
