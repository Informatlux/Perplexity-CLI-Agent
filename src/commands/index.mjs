
import * as about from './about.mjs';
import * as auth from './auth.mjs';
import * as bug from './bug.mjs';
import * as chat from './chat.mjs';
import * as clear from './clear.mjs';
import * as compress from './compress.mjs';
import * as copy from './copy.mjs';
import * as docs from './docs.mjs';
import * as directory from './directory.mjs';
import * as editor from './editor.mjs';
import * as extensions from './extensions.mjs';
import * as help from './help.mjs';
import * as ide from './ide.mjs';
import * as init from './init.mjs';
import * as mcp from './mcp.mjs';
import * as memory from './memory.mjs';
import * as model from './model.mjs';
import * as privacy from './privacy.mjs';
import * as quit from './quit.mjs';
import * as resume from './resume.mjs';
import * as stats from './stats.mjs';
import * as theme from './theme.mjs';
import * as tools from './tools.mjs';
import * as settings from './settings.mjs';
import * as vim from './vim.mjs';
import * as setup_github from './setup_github.mjs';
import * as terminal_setup from './terminal_setup.mjs';

import * as ls from './ls.mjs';
import * as cd from './cd.mjs';
import * as read from './read.mjs';
import * as edit from './edit.mjs';
import * as review from './review.mjs';
import * as git from './git.mjs';

const commands = {
    about, auth, bug, chat, clear, compress, copy, docs, directory,
    editor, extensions, help, ide, init, mcp, memory, model, privacy,
    quit, resume, stats, theme, tools, settings, vim,
    ls, cd, read, edit, review, git,
    'setup-github': setup_github,
    'terminal-setup': terminal_setup
};

export async function handleCommand(input, context) {
    const [cmdName, ...args] = input.trim().substring(1).split(' ');

    const command = commands[cmdName];
    if (!command) {
        return false; // Not handled
    }

    await command.execute(args, context);
    return true; // Handled
}

export function getCommands() {
    return commands;
}
