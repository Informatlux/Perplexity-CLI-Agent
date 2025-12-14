
import { c } from "../ui/colors.mjs";
import fs from "fs/promises";
import path from "path";

export const meta = {
    name: "ls",
    description: "List directory contents with detailed icons and stats",
    usage: "/ls [path]"
};

const ICONS = {
    dir: "📁",
    file: "📄",
    js: "📜",
    mjs: "📜",
    json: "⚙️ ",
    md: "📝",
    css: "🎨",
    html: "🌐",
    png: "🖼️ ",
    jpg: "🖼️ ",
    gitignore: "🔒"
};

const formatSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export async function execute(args, context) {
    const targetDir = args[0] ? path.resolve(context.root, args[0]) : context.root;
    // context.root is the current specific root, but if we did 'cd', process.cwd() might be different.
    // Let's use process.cwd() as the source of truth for 'current' unless args provided.
    const activeDir = args[0] ? path.resolve(args[0]) : process.cwd();

    try {
        const entries = await fs.readdir(activeDir, { withFileTypes: true });

        console.log(`\n${c.bold}📂 Contents of:${c.reset} ${c.cyan}${activeDir}${c.reset}\n`);

        // Sort: Directories first, then alphabetical
        entries.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });

        const rows = [];

        for (const entry of entries) {
            let icon = ICONS.file;
            let color = c.white;
            let details = "";

            if (entry.isDirectory()) {
                icon = ICONS.dir;
                color = c.brightBlue;
                details = "(dir)";
            } else {
                const ext = path.extname(entry.name).slice(1);
                icon = ICONS[ext] || ICONS.file;

                const stats = await fs.stat(path.join(activeDir, entry.name));
                details = formatSize(stats.size);

                if (ext === 'mjs' || ext === 'js') color = c.yellow;
                if (ext === 'md') color = c.magenta;
                if (ext === 'json') color = c.cyan;
                if (entry.name.startsWith('.')) color = c.dim;
            }

            rows.push({ icon, name: entry.name, details, color });
        }

        // Render
        // Find max name length for padding
        const maxName = Math.max(...rows.map(r => r.name.length), 10);

        rows.forEach(r => {
            const pad = " ".repeat(maxName - r.name.length);
            console.log(`  ${r.icon} ${r.color}${r.name}${c.reset} ${pad}  ${c.dim}${r.details}${c.reset}`);
        });

        console.log(`\n${c.dim}Total: ${entries.length} items.${c.reset}\n`);

    } catch (err) {
        console.log(`${c.red}Error accessing directory:${c.reset}`);
        console.log(err.message);
    }
}
