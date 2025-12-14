import fs from "node:fs/promises";
import path from "node:path";
import { SESSION_DIR, getRoot } from "../config/constants.mjs";
import { c } from "../ui/colors.mjs";

export async function saveSession(name, conversationHistory, settings) {
  await fs.mkdir(SESSION_DIR, { recursive: true });
  const sessionFile = path.join(SESSION_DIR, `${name}.json`);

  const session = {
    timestamp: new Date().toISOString(),
    root: getRoot(),
    history: conversationHistory,
    settings: settings
  };

  await fs.writeFile(sessionFile, JSON.stringify(session, null, 2), "utf8");
  console.log(`${c.green}✓${c.reset} Session saved: ${c.cyan}${name}${c.reset}\n`);
}

export async function loadSession(name) {
  const sessionFile = path.join(SESSION_DIR, `${name}.json`);

  try {
    const data = await fs.readFile(sessionFile, "utf8");
    const session = JSON.parse(data);

    console.log(`${c.green}✓${c.reset} Loaded: ${c.cyan}${name}${c.reset}`);
    console.log(`${c.dim}Time: ${new Date(session.timestamp).toLocaleString()}${c.reset}`);
    console.log(`${c.dim}Messages: ${session.history.length}${c.reset}\n`);
    
    return session;
  } catch (e) {
    console.log(`${c.red}✗${c.reset} Session not found: ${name}\n`);
    return null;
  }
}

export async function listSessions() {
  try {
    await fs.mkdir(SESSION_DIR, { recursive: true });
    const files = await fs.readdir(SESSION_DIR);

    if (files.length === 0) {
      console.log(`${c.yellow}⚠${c.reset} No saved sessions\n`);
      return;
    }

    console.log(`${c.bold}${c.brightCyan}💾 Saved Sessions${c.reset}\n`);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(SESSION_DIR, file), "utf8");
        const session = JSON.parse(data);
        const name = file.replace('.json', '');
        console.log(`  ${c.cyan}${name}${c.reset} ${c.dim}· ${new Date(session.timestamp).toLocaleString()}${c.reset}`);
      }
    }
    console.log();
  } catch (e) {
    console.log(`${c.red}✗${c.reset} Error listing sessions\n`);
  }
}
