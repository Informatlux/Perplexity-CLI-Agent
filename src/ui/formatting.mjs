import { c } from "./colors.mjs";

export function highlightSyntax(line, settings) {
  if (!settings.syntax) return line;
  line = line.replace(/\b(function|const|let|var|class|async|await|import|export|return|if|else|for|while|try|catch|throw|new|public|private|protected|override|fun|val)\b/g, `${c.magenta}$1${c.reset}`);
  line = line.replace(/\b(true|false|null|undefined)\b/g, `${c.blue}$1${c.reset}`);
  line = line.replace(/(['"])(.*?)\1/g, `${c.green}$1$2$1${c.reset}`);
  line = line.replace(/\/\/.*$/g, `${c.gray}$&${c.reset}`);
  return line;
}

export function showDiff(original, modified) {
  const oldLines = original.split("\n");
  const newLines = modified.split("\n");

  console.log(`${c.dim}--- Original${c.reset}`);
  console.log(`${c.dim}+++ Modified${c.reset}`);

  let i = 0, j = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      i++; j++;
    } else {
      if (i < oldLines.length) console.log(`${c.red}- ${oldLines[i]}${c.reset}`);
      if (j < newLines.length) console.log(`${c.green}+ ${newLines[j]}${c.reset}`);
      i++; j++;
    }
  }
}

export function formatResponse(text) {
  let output = text;
  output = output.replace(/^### (.*?)$/gm, `\n${c.bold}${c.brightMagenta}▸ $1${c.reset}`);
  output = output.replace(/^## (.*?)$/gm, `\n${c.bold}${c.brightCyan}▸▸ $1${c.reset}`);
  output = output.replace(/^# (.*?)$/gm, `\n${c.bold}${c.blue}▸▸▸ $1${c.reset}`);
  output = output.replace(/\*\*(.*?)\*\*/g, `${c.bold}$1${c.reset}`);
  output = output.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `\n${c.dim}┌─ ${lang || 'code'} ─┐${c.reset}\n${c.gray}${code}${c.reset}${c.dim}└──────┘${c.reset}\n`;
  });
  output = output.replace(/`([^`]+)`/g, `${c.yellow}$1${c.reset}`);
  output = output.replace(/^\- (.*?)$/gm, `${c.cyan}  •${c.reset} $1`);
  output = output.replace(/^\* (.*?)$/gm, `${c.cyan}  •${c.reset} $1`);
  output = output.replace(/^\d+\. (.*?)$/gm, `${c.cyan}  ▸${c.reset} $1`);
  return output;
}

export function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function getFileIcon(ext) {
  const icons = {
    '.js': '📜', '.mjs': '📜', '.ts': '📘', '.tsx': '📘',
    '.jsx': '⚛️', '.json': '📋', '.md': '📝', '.txt': '📄',
    '.py': '🐍', '.java': '☕', '.kt': '🎯', '.xml': '📰',
    '.html': '🌐', '.css': '🎨', '.png': '🖼️', '.jpg': '🖼️',
    '.gif': '🖼️', '.svg': '🎨', '.pdf': '📕', '.zip': '📦',
    '.gradle': '🐘', '.properties': '⚙️', '.yml': '⚙️'
  };
  return icons[ext.toLowerCase()] || '📄';
}
