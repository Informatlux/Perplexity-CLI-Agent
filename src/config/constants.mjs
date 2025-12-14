import path from "node:path";
import process from "node:process";

export const KEY = process.env.PPLX_API_KEY;

// Use an object so we can mutate the property
export const state = {
  ROOT: path.resolve(process.argv[2] ?? process.cwd())
};

export const SETTINGS_FILE = path.join(process.cwd(), "pplx-settings.json");
export const SESSION_DIR = path.join(process.cwd(), ".pplx-sessions");
export const BACKUP_DIR = path.join(process.cwd(), ".pplx-backups");
export const SNIPPETS_FILE = path.join(process.cwd(), "pplx-snippets.json");
export const BRAIN_FILE = path.join(process.cwd(), ".pplx-brain.json");

export function getRoot() {
  return state.ROOT;
}

export function setRoot(newRoot) {
  state.ROOT = newRoot;
}

export function safePath(p) {
  const ROOT = state.ROOT;
  const full = path.resolve(ROOT, p);
  if (!full.startsWith(ROOT + path.sep) && full !== ROOT) {
    throw new Error(`Blocked path (outside ROOT): ${p}`);
  }
  return full;
}
