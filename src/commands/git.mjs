
import { c } from "../ui/colors.mjs";

export const meta = {
    name: "git",
    description: "Run git commands",
    usage: "/git <cmd>"
};

export async function execute(args, context) {
    console.log(`${c.yellow}Command /git is being upgraded...${c.reset}`);
}
