import process from "node:process";
import { c } from "./colors.mjs";

export class BoxedInput {
  constructor(rl) {
    this.rl = rl;
    this.width = process.stdout.columns || 80;
  }

  drawBox(prompt = "", placeholder = "Type your message...") {
    const boxWidth = Math.min(this.width - 4, 120);
    const topBorder = `╭${"─".repeat(boxWidth)}╮`;
    const bottomBorder = `╰${"─".repeat(boxWidth)}╯`;
    
    // Clear previous output
    process.stdout.write('\n');
    
    // Draw top border
    console.log(c.dim + topBorder + c.reset);
    
    // Draw input line with prompt
    const promptText = prompt ? `${c.brightCyan}${prompt}${c.reset} ` : '';
    process.stdout.write(`${c.dim}│${c.reset} ${promptText}`);
    
    return { boxWidth, bottomBorder };
  }

  async question(prompt = "", showHelp = false) {
    const { boxWidth, bottomBorder } = this.drawBox(prompt);
    
    // Get input
    const input = await this.rl.question('');
    
    // Draw bottom border
    console.log(c.dim + bottomBorder + c.reset);
    
    // Show dropdown if requested
    if (showHelp) {
      this.showDropdown();
    }
    
    return input;
  }

  showDropdown() {
    const commands = [
      { cmd: 'ask', desc: 'Chat with AI (reads code!)' },
      { cmd: 'help', desc: 'Show all commands' },
      { cmd: 'settings', desc: 'View/edit configuration' },
      { cmd: '@', desc: 'Quick file list' },
      { cmd: 'quit', desc: 'Exit the agent' }
    ];

    console.log(`${c.dim}${"─".repeat(60)}${c.reset}`);
    console.log(`${c.dim}Quick commands:${c.reset}`);
    commands.forEach(({ cmd, desc }) => {
      console.log(`  ${c.cyan}${cmd.padEnd(12)}${c.reset}${c.dim}${desc}${c.reset}`);
    });
    console.log(`${c.dim}${"─".repeat(60)}${c.reset}\n`);
  }

  clear() {
    // Clear the input area
    process.stdout.write('\r\x1b[K');
  }

  drawStatusBar(model, context = null) {
    const statusText = context 
      ? `${c.brightCyan}${model}${c.reset} ${c.dim}• ${context}${c.reset}`
      : `${c.brightCyan}${model}${c.reset}`;
    
    console.log(`\n${c.dim}┌─ ${statusText} ─┐${c.reset}`);
  }
}

export async function createBoxedPrompt(rl, prompt, model) {
  const boxed = new BoxedInput(rl);
  
  // Draw status bar with model info
  boxed.drawStatusBar(model);
  
  // Get input with boxed UI
  const input = await boxed.question(prompt);
  
  return input;
}
