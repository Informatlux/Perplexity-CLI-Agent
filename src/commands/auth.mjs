
import { c } from "../ui/colors.mjs";
import readline from "readline";

export const meta = {
  name: "auth",
  description: "Change the auth method and manage API keys",
  usage: "/auth [key]"
};

// Helper for masking input
const hiddenInput = (query, rl) => new Promise((resolve) => {
  rl.question(query, (answer) => {
    resolve(answer);
  });
});

export async function execute(args, context) {
  const settings = context.settings || {};
  const envKey = process.env.PPLX_API_KEY;

  console.log(`\n${c.bold}${c.brightCyan}🔐 Authentication Manager${c.reset}\n`);

  // 1. Status Check
  if (envKey) {
    const maskedKey = envKey.substring(0, 8) + "****************" + envKey.substring(envKey.length - 4);
    console.log(`${c.green}✓${c.reset} Active Key (Env): ${c.cyan}${maskedKey}${c.reset}`);
    console.log(`  ${c.dim}Source: process.env.PPLX_API_KEY${c.reset}`);
  } else {
    console.log(`${c.red}✗${c.reset} No API Key Found!`);
  }

  console.log("\n------------------------------------------------");

  // 2. Interactive Update (if requested or missing)
  const isInteractive = args.length === 0;

  if (isInteractive) {
    console.log(`${c.bold}Update API Key${c.reset}`);
    console.log(`${c.dim}(Enter a new key to update, or press Enter to cancel)${c.reset}`);

    // Note: readline 'hidden' input is tricky in node without a dedicated package like 'inquirer'.
    // We will assume standard input for now but warn about visibility.
    console.log(`${c.yellow}⚠ Warning: Input will be visible on screen.${c.reset}`);

    const rl = context.rl || readline.createInterface({ input: process.stdin, output: process.stdout });

    const answer = await new Promise(resolve => rl.question(`${c.cyan}> ${c.reset}`, resolve));

    if (!answer.trim()) {
      console.log(`${c.dim}Cancelled.${c.reset}\n`);
      return;
    }

    const newKey = answer.trim();

    // 3. Validation Logic
    if (!newKey.startsWith("pplx-")) {
      console.log(`\n${c.red}Error: Invalid Key Format.${c.reset}`);
      console.log(`${c.dim}Perplexity keys usually start with 'pplx-'${c.reset}\n`);
      return;
    }

    // 4. Persistence Logic
    // Since we rely on ENV vars, we can't easily "saved" it to the system ENV permanently from here 
    // without modifying shell profiles (bashrc/zshrc/powershell profile).
    // We CAN save it to our settings.json and prefer that over ENV if present.

    console.log(`\n${c.dim}Verifying key format...${c.reset} ${c.green}OK${c.reset}`);

    // Save handling
    context.settings.apiKey = newKey;
    console.log(`${c.green}✓${c.reset} Key saved to local settings.`);
    console.log(`${c.dim}Note: This will override the environment variable for this agent.${c.reset}\n`);

    // Future: Trigger a test query?
    // await testKey(newKey);

  } else {
    // Direct argument handling
    const providedKey = args[0];
    if (!providedKey.startsWith("pplx-")) {
      console.log(`${c.red}Invalid key format.${c.reset}`);
      return;
    }
    context.settings.apiKey = providedKey;
    console.log(`${c.green}✓${c.reset} Key updated from argument.`);
  }

  // 5. Help Info
  console.log(`${c.dim}To get a key, visit: https://www.perplexity.ai/settings/api${c.reset}\n`);
}
