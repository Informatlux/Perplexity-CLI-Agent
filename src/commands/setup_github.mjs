
import { c } from "../ui/colors.mjs";
import { writeFile } from "../filesystem/operations.mjs";

export const meta = {
  name: "setup-github",
  description: "Set up GitHub Actions",
  usage: "/setup-github"
};

export async function execute(args, context) {
  console.log(`${c.bold}Setting up GitHub Actions...${c.reset}`);

  const yaml = `name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
`;

  const path = ".github/workflows/ci.yml";
  try {
    await writeFile(path, yaml);
    console.log(`${c.green}✓${c.reset} Created ${c.cyan}${path}${c.reset}`);
  } catch (e) {
    console.log(`${c.red}Failed:${c.reset} ${e.message}`);
  }
}
