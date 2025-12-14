
import { c } from "../ui/colors.mjs";
import { listSessions } from "../sessions/sessions.mjs";

export const meta = {
  name: "resume",
  description: "Browse and resume auto-saved conversations",
  usage: "/resume"
};

export async function execute(args, context) {
  console.log(`${c.dim}To resume a session, use: /chat resume <tag>${c.reset}\n`);
  await listSessions();
}
