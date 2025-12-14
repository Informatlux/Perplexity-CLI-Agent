// ANSI Colors
export const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
  brightCyan: "\x1b[96m",
  brightMagenta: "\x1b[95m",
  brightYellow: "\x1b[93m",

  // Perplexity Brand Colors
  pplx: {
    teal: "\x1b[38;2;32;128;141m", // #20808D
    white: "\x1b[38;2;251;250;244m", // #FBFAF4
    black: "\x1b[38;2;9;23;23m", // #091717
  }
};

export function rgb(r, g, b) {
  return `\x1b[38;2;${r};${g};${b}m`;
}
