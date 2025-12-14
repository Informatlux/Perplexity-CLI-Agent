
import { c } from "../ui/colors.mjs";
import os from "os";
import { execSync } from "child_process";

export const meta = {
  name: "about",
  description: "Show system and CLI information",
  usage: "/about"
};

const getGitInfo = () => {
  try {
    const commit = execSync("git rev-parse --short HEAD", { stdio: "pipe" }).toString().trim();
    const email = execSync("git config user.email", { stdio: "pipe" }).toString().trim();
    return { commit, email };
  } catch (e) {
    return { commit: "unknown", email: "unknown" };
  }
};

export async function execute(args, context) {
  const version = "0.20.2";
  const { commit, email } = getGitInfo();
  const model = context.settings.model || "auto";
  const platform = os.platform();
  const auth = process.env.PPLX_API_KEY ? "OAuth" : "None";

  const width = process.stdout.columns || 80;
  const boxWidth = Math.min(width - 4, 85);
  const lineChar = "─";
  const topBorder = `╭${lineChar.repeat(boxWidth - 2)}╮`;
  const botBorder = `╰${lineChar.repeat(boxWidth - 2)}╯`;

  console.log("");
  console.log(`  ${c.pplx.teal}${topBorder}${c.reset}`);

  // Content Helper
  const printLine = (str, colorWrapper = (s) => s) => {
    const visibleLen = str.replace(/\x1B\[[0-9;]*[mK]/g, '').length;
    const pad = boxWidth - 2 - visibleLen - 2;
    console.log(`  ${c.pplx.teal}│${c.reset}  ${colorWrapper(str)}${" ".repeat(Math.max(0, pad))}${c.pplx.teal}│${c.reset}`);
  };

  const printPair = (label, value) => {
    const labelLen = label.length;
    const valLen = value.replace(/\x1B\[[0-9;]*[mK]/g, '').length;
    const space = Math.max(0, boxWidth - 6 - labelLen - valLen);
    console.log(`  ${c.pplx.teal}│${c.reset}  ${c.bold}${c.pplx.teal}${label}${c.reset}${" ".repeat(space)}${value}  ${c.pplx.teal}│${c.reset}`);
  };

  printLine("");
  printLine("About Gemini CLI", (s) => `${c.bold}${c.magenta}${s}${c.reset}`);
  printLine("");

  printPair("CLI Version", `${c.white}${version}${c.reset}`);
  printPair("Git Commit", `${c.dim}${commit}${c.reset}`);
  printPair("Model", `${c.white}${model}${c.reset}`);
  printPair("Sandbox", `${c.dim}no sandbox${c.reset}`);
  printPair("OS", `${c.white}${platform}${c.reset}`);
  printPair("Auth Method", `${c.white}${auth}${c.reset}`);
  printPair("User Email", `${c.white}${email}${c.reset}`);

  printLine("");
  console.log(`  ${c.pplx.teal}${botBorder}${c.reset}\n`);
}
