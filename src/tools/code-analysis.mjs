import { c } from "../ui/colors.mjs";
import { formatResponse } from "../ui/formatting.mjs";
import { startSpinner, stopSpinner } from "../ui/spinner.mjs";
import { pplx } from "../api/perplexity.mjs";
import { readFileQuietly } from "../filesystem/operations.mjs";
import { analyzeProject } from "../project/analysis.mjs";

export async function reviewCode(file, settings) {
  const content = await readFileQuietly(file);
  const sys = "You are a senior code reviewer. Analyze for: bugs, performance issues, security vulnerabilities, best practices, and improvements. Provide a structured review.";
  const user = `Review:\n\nFile: ${file}\n\n${content}`;

  startSpinner("Reviewing code");
  const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { settings });
  stopSpinner();

  console.log(`\n${c.bold}${c.brightMagenta}🔍 Code Review: ${file}${c.reset}\n`);
  console.log(formatResponse(text));
  console.log();
}

export async function codeMetrics(file) {
  const content = await readFileQuietly(file);
  const lines = content.split('\n');

  const totalLines = lines.length;
  const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
  const commentLines = lines.filter(l => l.trim().startsWith('//')).length;
  const blankLines = lines.filter(l => !l.trim()).length;

  console.log(`\n${c.bold}${c.brightCyan}📊 Code Metrics: ${file}${c.reset}\n`);
  console.log(`${c.dim}Total Lines:${c.reset}    ${c.yellow}${totalLines}${c.reset}`);
  console.log(`${c.dim}Code Lines:${c.reset}     ${c.green}${codeLines}${c.reset}`);
  console.log(`${c.dim}Comments:${c.reset}       ${c.blue}${commentLines}${c.reset}`);
  console.log(`${c.dim}Blank Lines:${c.reset}    ${c.gray}${blankLines}${c.reset}`);
  console.log(`${c.dim}Code/Comment:${c.reset}   ${c.yellow}${(codeLines / Math.max(commentLines, 1)).toFixed(2)}${c.reset}\n`);
}
