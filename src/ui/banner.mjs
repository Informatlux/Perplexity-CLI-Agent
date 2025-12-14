
import { c, rgb } from "./colors.mjs";
import process from "node:process";

const BANNER_ART = [
    "██████╗ ███████╗██████╗ ██████╗ ██╗     ███████╗██╗  ██╗██╗████████╗██╗   ██╗",
    "██╔══██╗██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝╚██╗██╔╝██║╚══██╔══╝╚██╗ ██╔╝",
    "██████╔╝█████╗  ██████╔╝██████╔╝██║     █████╗   ╚███╔╝ ██║   ██║    ╚████╔╝ ",
    "██╔═══╝ ██╔══╝  ██╔══██╗██╔═══╝ ██║     ██╔══╝   ██╔██╗ ██║   ██║     ╚██╔╝  ",
    "██║     ███████╗██║  ██║██║     ███████╗███████╗██╔╝ ██╗██║   ██║      ██║   ",
    "╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝      ╚═╝   "
];

function printGradientBanner() {
    const termWidth = process.stdout.columns || 80;

    // Scale Logic: 2x if wide enough
    const scale = (termWidth >= 160) ? 2 : 1;
    let lines = BANNER_ART;

    if (scale === 2) {
        // Pixel-Doubling Algorithm
        lines = lines.flatMap(line => {
            const doubledLine = line.split('').map(c => c.repeat(2)).join('');
            return [doubledLine, doubledLine]; // Return 2 identical lines
        });
    }

    const height = lines.length;
    const bannerWidth = lines[0].length;

    // Center it
    const padding = Math.max(0, Math.floor((termWidth - bannerWidth) / 2));
    const padStr = " ".repeat(padding);

    // Gradient Setup (Teal -> Turquoise)
    const startColor = { r: 32, g: 128, b: 141 };
    const endColor = { r: 64, g: 224, b: 208 };

    console.log(); // Spacing

    for (let i = 0; i < height; i++) {
        // Vertical gradient
        const ratio = i / (height - 1);
        const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
        const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
        const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);

        console.log(padStr + rgb(r, g, b) + lines[i] + c.reset);
    }
}

export function printGeminiStyleBanner() {
    printGradientBanner();

    // Use standard colors safely
    const white = (c.pplx && c.pplx.white) ? c.pplx.white : c.white;
    const teal = (c.pplx && c.pplx.teal) ? c.pplx.teal : c.cyan;

    console.log(`\n${white}Tips for getting started:${c.reset}`);
    console.log(`${white} 1. Ask questions, edit files, or run commands.${c.reset}`);
    console.log(`${white} 2. Be specific for the best results.${c.reset}`);
    console.log(`${white} 3. ${teal}/help${c.reset}${white} for more information.${c.reset}\n`);
}
