import { c } from "../ui/colors.mjs";
import path from "path";
import fs from "fs/promises";

export const meta = {
  name: "directory",
  description: "Manage multiple workspace directories",
  usage: "/directory <add|list|remove|switch> [path]"
};

// Helper to check directory existence
async function dirExists(p) {
  try {
    const stats = await fs.stat(p);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function execute(args, context) {
  const [subcmd = "list", ...rest] = args;

  // Ensure we have a workspace list in context or settings
  if (!context.settings.workspaces) {
    context.settings.workspaces = [context.root];
  }
  const workspaces = context.settings.workspaces;

  // 1. List Workspaces
  if (subcmd === "list" || subcmd === "ls") {
    console.log(`\n${c.bold}📂 Application Workspaces${c.reset}\n`);

    workspaces.forEach((ws, idx) => {
      const isCurrent = ws === context.root;
      const marker = isCurrent ? `${c.green}●${c.reset}` : `${c.dim}○${c.reset}`;
      const style = isCurrent ? c.cyan : c.white;
      console.log(`  ${marker} ${style}${ws}${c.reset}`);
    });
    console.log(`\n${c.dim}Use /directory switch <path> to change active context.${c.reset}\n`);
    return;
  }

  // 2. Add Workspace
  if (subcmd === "add") {
    const target = rest.join(" ");
    if (!target) {
      console.log(`${c.red}Error: Path required.${c.reset} usage: /directory add ./foo`);
      return;
    }

    const resolved = path.resolve(target);
    if (!(await dirExists(resolved))) {
      console.log(`${c.red}Error: Directory not found:${c.reset} ${resolved}`);
      return;
    }

    if (!workspaces.includes(resolved)) {
      workspaces.push(resolved);
      await context.saveSettings(); // Assuming method exists or we save manually
      console.log(`${c.green}✓${c.reset} Added workspace: ${c.dim}${resolved}${c.reset}`);
    } else {
      console.log(`${c.yellow}Workspace already exists.${c.reset}`);
    }
    return;
  }

  // 3. Switch Workspace (Set Root)
  if (subcmd === "switch") {
    const target = rest.join(" ");
    // Simple fuzzy match or exact
    const match = workspaces.find(w => w.includes(target) || w === path.resolve(target));

    if (match) {
      context.setRoot(match);
      console.log(`${c.green}✓${c.reset} Switched context to: ${c.cyan}${match}${c.reset}`);
    } else {
      // Try as new path?
      const resolved = path.resolve(target);
      if (await dirExists(resolved)) {
        context.setRoot(resolved);
        if (!workspaces.includes(resolved)) workspaces.push(resolved);
        console.log(`${c.green}✓${c.reset} Switched to new path: ${c.cyan}${resolved}${c.reset}`);
      } else {
        console.log(`${c.red}Directory not found in workspaces or filesystem.${c.reset}`);
      }
    }
    return;
  }

  // 4. Remove Workspace
  if (subcmd === "remove" || subcmd === "rm") {
    const target = rest.join(" ");
    const idx = workspaces.findIndex(w => w.includes(target));

    if (idx !== -1) {
      const removed = workspaces[idx];
      workspaces.splice(idx, 1);
      console.log(`${c.green}✓${c.reset} Removed: ${c.dim}${removed}${c.reset}`);
      // If we removed current, switch to first?
      if (removed === context.root && workspaces.length > 0) {
        context.setRoot(workspaces[0]);
        console.log(`${c.yellow}Switched to fallback: ${workspaces[0]}${c.reset}`);
      }
    } else {
      console.log(`${c.red}Workspace not found matching: ${target}${c.reset}`);
    }
    return;
  }

  console.log(`${c.yellow}Unknown subcommand.${c.reset}`);
}
