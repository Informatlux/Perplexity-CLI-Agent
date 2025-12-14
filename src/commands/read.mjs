
import { c } from "../ui/colors.mjs";
import fs from "fs/promises";
import path from "path";

export const meta = {
    name: "read",
    description: "Read a file with simulated syntax highlighting",
    usage: "/read <file>"
};

export async function execute(args, context) {
    if (!args[0]) {
        console.log(`${c.red}Error: No file specified.${c.reset}`);
        return;
    }

    const filePath = path.resolve(process.cwd(), args[0]);

    try {
        const content = await fs.readFile(filePath, "utf-8");

        console.log(`\n${c.bold}📄 Reading file:${c.reset} ${c.cyan}${path.basename(filePath)}${c.reset}`);
        console.log(`${c.dim}Path: ${filePath}${c.reset}\n`);

        const lines = content.split('\n');
        const maxLines = 200; // Limit for safety

        const ext = path.extname(filePath);

        // Simple coloring function
        const colorize = (line) => {
            if (ext === '.js' || ext === '.mjs') {
                // Very naive highlighting
                return line
                    .replace(/(import|export|const|let|var|function|return|async|await)/g, `${c.magenta}$1${c.reset}`)
                    .replace(/('.*?'|".*?")/g, `${c.green}$1${c.reset}`) // Strings
                    .replace(/(\/\/.*)/g, `${c.dim}$1${c.reset}`); // Comments
            }
            if (ext === '.md') {
                if (line.startsWith('#')) return `${c.bold}${c.blue}${line}${c.reset}`;
                return line;
            }
            return line;
        };

        const linePad = String(lines.length).length;

        lines.slice(0, maxLines).forEach((line, idx) => {
            const num = String(idx + 1).padEnd(linePad, ' ');
            console.log(`${c.dim}${num} |${c.reset} ${colorize(line)}`);
        });

        if (lines.length > maxLines) {
            console.log(`\n${c.yellow}... ${lines.length - maxLines} more lines truncated ...${c.reset}`);
            console.log(`${c.dim}Use an external editor to view full file.${c.reset}`);
        }

        console.log(); // Spacing

    } catch (err) {
        console.log(`${c.red}Error reading file:${c.reset} ${err.message}`);
    }
}
