import { startSpinner, stopSpinner } from "../ui/spinner.mjs";
import { pplx } from "../api/perplexity.mjs";
import { readFileQuietly } from "../filesystem/operations.mjs";
import { analyzeProject } from "../project/analysis.mjs";
import { getGitDiff, isGitRepo } from "../git/operations.mjs";
import { c } from "../ui/colors.mjs";

export async function generateTests(file, settings) {
  const content = await readFileQuietly(file);
  const projectType = await analyzeProject();
  let framework = "Jest";
  if (projectType === "python") framework = "pytest";
  if (projectType === "java" || projectType === "android") framework = "JUnit";

  const sys = `Generate comprehensive unit tests using ${framework}. Include setup/teardown, positive/negative cases, edge cases, mocks. Return ONLY test code.`;
  const user = `Generate tests:\n\n${content}`;

  startSpinner("Generating tests");
  const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: 0.2, settings });
  stopSpinner();

  return text;
}

export async function generateDocs(file, settings) {
  const content = await readFileQuietly(file);
  const sys = "Generate comprehensive documentation with: overview, functions/classes, parameters, usage examples, return values. Return ONLY documented code.";
  const user = `Document:\n\n${content}`;

  startSpinner("Generating docs");
  const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: 0.3, settings });
  stopSpinner();

  return text;
}

export async function refactorCode(file, settings) {
  const original = await readFileQuietly(file);
  const sys = "Refactor this code: improve structure, performance, readability, follow best practices. Return ONLY the refactored code.";
  const user = `Refactor:\n\n${original}`;

  startSpinner("Refactoring");
  const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: 0.2, settings });
  stopSpinner();

  return text;
}

export async function generateCommitMessage(settings) {
  if (!isGitRepo()) {
    console.log(`${c.red}✗${c.reset} Not a git repository\n`);
    return null;
  }

  const diff = getGitDiff();
  if (!diff) {
    console.log(`${c.yellow}⚠${c.reset} No changes to commit\n`);
    return null;
  }

  const sys = "Generate a concise conventional commit message. Format: <type>(<scope>): <description>. Types: feat, fix, docs, style, refactor, test, chore. Keep under 72 chars.";
  const user = `Generate commit message:\n\n${diff.slice(0, 3000)}`;

  startSpinner("Generating commit");
  const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { temperature: 0.3, settings });
  stopSpinner();

  console.log(`\n${c.bold}${c.brightCyan}📝 Suggested Commit:${c.reset}\n`);
  console.log(`${c.green}${text.trim()}${c.reset}\n`);
  
  return text.trim();
}
