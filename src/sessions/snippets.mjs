import fs from "node:fs/promises";
import { SNIPPETS_FILE } from "../config/constants.mjs";
import { c } from "../ui/colors.mjs";

export async function loadSnippetsLibrary() {
  try {
    const data = await fs.readFile(SNIPPETS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function saveSnippets(snippetsLibrary) {
  await fs.writeFile(SNIPPETS_FILE, JSON.stringify(snippetsLibrary, null, 2), "utf8");
}

export async function saveSnippet(name, code, snippetsLibrary) {
  snippetsLibrary[name] = { code, timestamp: new Date().toISOString() };
  await saveSnippets(snippetsLibrary);
  console.log(`${c.green}✓${c.reset} Snippet saved: ${c.cyan}${name}${c.reset}\n`);
}

export function loadSnippet(name, snippetsLibrary) {
  const snippet = snippetsLibrary[name];
  if (!snippet) {
    console.log(`${c.red}✗${c.reset} Snippet not found: ${name}\n`);
    return null;
  }
  return snippet.code;
}

export function listSnippets(snippetsLibrary) {
  const names = Object.keys(snippetsLibrary);
  if (names.length === 0) {
    console.log(`${c.yellow}⚠${c.reset} No saved snippets\n`);
    return;
  }

  console.log(`${c.bold}${c.brightCyan}✂️  Code Snippets${c.reset}\n`);
  for (const name of names) {
    const snippet = snippetsLibrary[name];
    const preview = snippet.code.split('\n')[0].slice(0, 50);
    console.log(`  ${c.cyan}${name}${c.reset} ${c.dim}· ${preview}...${c.reset}`);
  }
  console.log();
}
