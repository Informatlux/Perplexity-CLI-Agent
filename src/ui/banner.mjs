import { c, rgb } from "./colors.mjs";
import process from "node:process";

import { LETTERS } from "./art.mjs";

function printGradientBanner() {
    // Defines the sequence of letters for "PERPLEXITY"
    const text = "PERPLEXITY";
    const letterKeys = text.split("");

    // Get terminal width
    const termWidth = process.stdout.columns || 80;

    // "1 inch" margin. ~10-12 chars.
    const marginSize = 12;
    const totalMargin = marginSize * 2;

    // Calculate total width of the letters themselves (0 spacing)
    let totalContentWidth = 0;
    const letterBlocks = letterKeys.map(k => LETTERS[k]);

    letterBlocks.forEach(block => {
        // Use spread operator to count visual chars correctly if emojis used, 
        // but here strictly ASCII art blocks, so length is fine.
        totalContentWidth += block[0].length;
    });

    // Available space for "Gaps"
    // User requested NOT to have huge letter spacing.
    // So we fill the width mainly with the letters (which are now wide).
    // Any remaining space is distributed, but we should center the whole block 
    // if the gaps become too large? 
    // "Covers the width leaving 1 inch from side" implying we MUST use that width?
    // If the font is 120 chars wide and screen is 150, we have 30 chars/9 gaps = 3 spaces. Good.
    // If screen is 200, gaps = ~8 spaces. Might be a bit much?
    // User said "not to keep 1 inch letter spacing".

    const availableSpace = Math.max(0, termWidth - totalMargin - totalContentWidth);
    const gaps = Math.max(1, letterBlocks.length - 1);
    const spacePerGap = Math.floor(availableSpace / gaps);

    // If gaps are too huge (> 5 spaces), the user might dislike it.
    // But they asked to "cover the width".
    // I will stick to "cover the width" logic as primary, but maybe cap it?
    // "not to keep 1 inch letter spacing" -> 1 inch is ~10 chars. 
    // So keeps gaps < 10.

    let gapStr = " ".repeat(spacePerGap);
    let leftMarginStr = " ".repeat(marginSize);

    // If spacePerGap is huge (e.g. ultra wide monitor), maybe we should center the block instead?
    // "make the perplexity more bigger... so that it covers the width"
    // I think the Wide Font will do most of the work. 

    // Left Margin
    const marginStr = " ".repeat(marginSize);

    // Gradient Setup
    // Start: 32, 128, 141 (#20808D)
    // End: 64, 224, 208 (Turquoise)
    const startColor = { r: 32, g: 128, b: 141 };
    const endColor = { r: 64, g: 224, b: 208 };

    const height = 6; // Fixed height of our font

    console.log(); // Spacing

    for (let i = 0; i < height; i++) {
        // Build the full line string
        let lineBuffer = marginStr;

        letterBlocks.forEach((block, index) => {
            // Append the slice of the letter
            lineBuffer += block[i];
            // Append gap if not last letter
            if (index < letterBlocks.length - 1) {
                lineBuffer += gapStr;
            }
        });

        // Apply Gradient to the whole line? 
        // Or vertical? Standard is vertical gradient for these banners usually.
        // Let's do vertical gradient (row by row).

        const ratio = i / (height - 1);
        const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
        const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
        const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);

        console.log(rgb(r, g, b) + lineBuffer + c.reset);
    }
}

export function printGeminiStyleBanner() {
    printGradientBanner();

    // Use standard colors safely
    const white = (c.pplx && c.pplx.white) ? c.pplx.white : c.white;
    const teal = (c.pplx && c.pplx.teal) ? c.pplx.teal : c.cyan;

    console.log(`\n${white}Tips for getting started:${c.reset} `);
    console.log(`${white} 1. Ask questions, edit files, or run commands.${c.reset} `);
    console.log(`${white} 2. Be specific for the best results.${c.reset} `);
    console.log(`${white} 3. ${teal}/help${c.reset}${white} for more information.${c.reset}\n`);
}
