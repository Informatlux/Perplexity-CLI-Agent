
import { c } from "../ui/colors.mjs";
import { saveSession, loadSession, listSessions } from "../sessions/sessions.mjs";

export const meta = {
  name: "chat",
  description: "Manage conversation history",
  usage: "/chat <subcommand> [args]"
};

export async function execute(args, context) {
  const [subcmd, ...rest] = args;

  if (!subcmd) {
    console.log(`${c.bold}Usage:${c.reset}`);
    console.log(`  ${c.cyan}/chat list${c.reset}          List saved sessions`);
    console.log(`  ${c.cyan}/chat save <tag>${c.reset}    Save current session`);
    console.log(`  ${c.cyan}/chat resume <tag>${c.reset}  Resume a session`);
    console.log(`  ${c.cyan}/chat clear${c.reset}         Clear history`);
    return;
  }

  if (subcmd === "save") {
    const tag = rest[0];
    if (!tag) {
      console.log(`${c.red}Error:${c.reset} valid tag required. /chat save <tag>`);
      return;
    }
    await saveSession(tag, context.conversationHistory, context.settings);
  }
  else if (subcmd === "resume" || subcmd === "load") {
    const tag = rest[0];
    if (!tag) {
      console.log(`${c.red}Error:${c.reset} valid tag required. /chat resume <tag>`);
      return;
    }
    const session = await loadSession(tag);
    if (session) {
      // We need to update context.conversationHistory. 
      // Since context.conversationHistory is a reference to the array array, 
      // assigning a new array to the variable inside simple context won't update the caller's reference 
      // UNLESS the caller uses an object property for history or we have a setHistory method.
      // context.conversationHistory is the array itself passed by reference? 
      // No, arrays are objects pass by reference, but reassigning the variable `history = newArray` 
      // only changes local variable. 
      // The context object HAS a property conversationHistory pointing to the array.
      // We can modify the array in place:
      context.conversationHistory.length = 0;
      context.conversationHistory.push(...session.history);
      if (session.root) context.setRoot(session.root);
      console.log(`${c.green}✓${c.reset} Session '${tag}' loaded.`);
    }
  }
  else if (subcmd === "list") {
    await listSessions();
  }
  else if (subcmd === "clear") {
    context.clearHistory();
    console.log(`${c.green}✓${c.reset} History cleared.`);
  }
  else {
    console.log(`${c.red}Unknown subcommand:${c.reset} ${subcmd}`);
  }
}
