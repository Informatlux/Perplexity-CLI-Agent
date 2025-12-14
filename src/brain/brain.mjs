import fs from "node:fs/promises";
import path from "node:path";
import { BRAIN_FILE, getRoot } from "../config/constants.mjs";
import { c } from "../ui/colors.mjs";
import { startSpinner, stopSpinner } from "../ui/spinner.mjs";
import { pplx } from "../api/perplexity.mjs";
import { collectProjectFiles } from "../project/analysis.mjs";
import { readFileQuietly } from "../filesystem/operations.mjs";

export async function loadBrain() {
  try {
    const data = await fs.readFile(BRAIN_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {
      name: path.basename(getRoot()),
      description: "",
      architecture: "",
      conventions: "",
      importantFiles: [],
      lastUpdated: null
    };
  }
}

export async function saveBrain(projectBrain) {
  projectBrain.lastUpdated = new Date().toISOString();
  await fs.writeFile(BRAIN_FILE, JSON.stringify(projectBrain, null, 2), "utf8");
}

export async function initBrain() {
  const projectBrain = {
    name: path.basename(getRoot()),
    description: "A Node.js CLI Agent",
    architecture: "Monolithic script",
    conventions: "ES Modules, Async/Await",
    importantFiles: ["agent.mjs"],
    lastUpdated: new Date().toISOString()
  };
  
  await saveBrain(projectBrain);
  console.log(`${c.green}✓${c.reset} Brain initialized. Edit .pplx-brain.json to add details.\n`);
  
  return projectBrain;
}

export async function updateBrain(projectBrain, settings) {
  startSpinner("Updating Brain");
  
  const files = await collectProjectFiles(2);
  projectBrain.importantFiles = files.slice(0, 10);

  // Ask AI to summarize project
  const sys = "Analyze this project structure and package.json. Return a JSON object with keys: description, architecture, conventions.";
  const pkg = await readFileQuietly("package.json").catch(() => "");
  const fileList = files.join("\n");
  const user = `Context:\n${pkg}\n\nFiles:\n${fileList}`;

  try {
    const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { settings });
    try {
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || "{}";
      const analysis = JSON.parse(jsonStr);
      projectBrain = { ...projectBrain, ...analysis, lastUpdated: new Date().toISOString() };
    } catch (e) {
      console.log(`${c.yellow}⚠ Could not parse AI analysis${c.reset}`);
    }
  } catch (e) { }

  await saveBrain(projectBrain);
  stopSpinner();
  console.log(`${c.green}✓${c.reset} Brain updated\n`);
  
  return projectBrain;
}

export function showBrain(projectBrain) {
  console.log(`\n${c.bold}${c.brightMagenta}🧠 Project Brain${c.reset}\n`);
  console.log(JSON.stringify(projectBrain, null, 2));
  console.log();
}
