
import { c } from "../ui/colors.mjs";
import { exec } from "child_process";
import os from "os";

export const meta = {
  name: "copy",
  description: "Copy the last AI response to clipboard",
  usage: "/copy"
};

export async function execute(args, context) {
  const history = context.conversationHistory || [];

  // Find last assistant message
  const lastMsg = [...history].reverse().find(m => m.role === 'assistant');

  if (!lastMsg || !lastMsg.content) {
    console.log(`${c.red}No recent AI response found to copy.${c.reset}`);
    return;
  }

  const text = lastMsg.content;

  // Simple clipboard copy for Windows (clip) or Mac (pbcopy) or Linux (xclip)
  // Since we know user is on Windows (per prompt metadata)
  let cmd = "clip";
  if (os.platform() === 'darwin') cmd = 'pbcopy';
  else if (os.platform() === 'linux') cmd = 'xclip -selection clipboard';

  const proc = exec(cmd, (err) => {
    if (err) console.error(`${c.red}Failed to copy: ${err.message}${c.reset}`);
    else console.log(`${c.green}✓${c.reset} Helper response copied to clipboard!`);
  });

  proc.stdin.write(text);
  proc.stdin.end();
}
