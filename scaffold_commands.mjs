
import fs from 'fs';
import path from 'path';

const commands = [
    'about', 'auth', 'bug', 'chat', 'clear', 'compress', 'copy',
    'docs', 'directory', 'editor', 'extensions', 'help', 'ide',
    'init', 'mcp', 'memory', 'model', 'privacy', 'quit', 'resume',
    'stats', 'theme', 'tools', 'settings', 'vim', 'setup_github', 'terminal_setup'
];

const template = (name) => `
import { c } from "../ui/colors.mjs";

export const meta = {
  name: "${name}",
  description: "Description for ${name}",
  usage: "/${name}"
};

export async function execute(args, context) {
  console.log(\`\${c.yellow}Command /${name} not yet implemented.\${c.reset}\`);
}
`;

if (!fs.existsSync('src/commands')) {
    fs.mkdirSync('src/commands');
}

commands.forEach(cmd => {
    const filename = cmd.replace('-', '_') + '.mjs';
    fs.writeFileSync(path.join('src/commands', filename), template(cmd.replace('_', '-')));
    console.log(`Created ${filename}`);
});
