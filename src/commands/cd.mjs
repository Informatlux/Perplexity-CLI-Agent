
import { c } from "../ui/colors.mjs";
import fs from "fs/promises";
import path from "path";

export const meta = {
    name: "cd",
    description: "Change current working directory",
    usage: "/cd <path>"
};

export async function execute(args, context) {
    if (args.length === 0) {
        console.log(`${c.yellow}Usage:${c.reset} /cd <path>`);
        console.log(`${c.dim}Current: ${process.cwd()}${c.reset}`);
        return;
    }

    const target = args[0];
    const newPath = path.resolve(process.cwd(), target);

    try {
        const stats = await fs.stat(newPath);

        if (!stats.isDirectory()) {
            console.log(`${c.red}Not a directory:${c.reset} ${target}`);
            return;
        }

        process.chdir(newPath);
        context.root = newPath;

        console.log(`${c.green}✓${c.reset} Directory changed to:`);
        console.log(`  ${c.bold}${c.cyan}${newPath}${c.reset}\n`);

    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log(`${c.red}Directory not found:${c.reset} ${target}`);
        } else {
            console.log(`${c.red}Error changing directory:${c.reset} ${err.message}`);
        }
    }
}
