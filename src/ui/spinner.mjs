import process from "node:process";
import { c } from "./colors.mjs";

let spinnerInterval = null;
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerFrame = 0;

export function startSpinner(text = "Thinking") {
  spinnerFrame = 0;
  spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${c.cyan}${spinnerFrames[spinnerFrame]} ${text}...${c.reset}`);
    spinnerFrame = (spinnerFrame + 1) % spinnerFrames.length;
  }, 80);
}

export function stopSpinner() {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
  }
}
