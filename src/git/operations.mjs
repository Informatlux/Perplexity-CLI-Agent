import { execSync } from "node:child_process";
import { getRoot } from "../config/constants.mjs";

export function isGitRepo() {
  try {
    execSync("git rev-parse --git-dir", { cwd: getRoot(), stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function getGitStatus() {
  try {
    return execSync("git status --short", { cwd: getRoot(), encoding: "utf8" });
  } catch {
    return "";
  }
}

export function getGitDiff() {
  try {
    return execSync("git diff", { cwd: getRoot(), encoding: "utf8", maxBuffer: 1024 * 1024 * 5 });
  } catch {
    return "";
  }
}

export function getGitLog(count = 5) {
  try {
    return execSync(`git log -${count} --pretty=format:"%h - %s (%cr) <%an>"`, {
      cwd: getRoot(),
      encoding: "utf8"
    });
  } catch {
    return "";
  }
}
