
import { c } from "../ui/colors.mjs";
import { showSettings } from "../ui/help.mjs";
import { saveSettings } from "../config/settings.mjs";

export const meta = {
  name: "settings",
  description: "View and edit Gemini CLI settings",
  usage: "/settings [set <key> <value>]"
};

export async function execute(args, context) {
  const [op, key, ...valParts] = args;

  if (op === "set" && key) {
    const value = valParts.join(" ");
    const settings = context.settings;
    const boolVal = value.toLowerCase() === "true";

    if (key === "model") settings.model = value;
    else if (key === "temperature") settings.temperature = Math.min(1, Math.max(0, parseFloat(value)));
    else if (key === "editTemp") settings.editTemp = Math.min(1, Math.max(0, parseFloat(value)));
    else if (key === "maxHistory") settings.maxHistory = parseInt(value);
    else if (key === "maxFilesPerQuery") settings.maxFilesPerQuery = parseInt(value);
    else if (key === "colorScheme") settings.colorScheme = value;
    else if (["autoContext", "syntax", "askPermission", "autoSuggest", "gitIntegration",
      "conversationalMode", "smartFileDetection", "showFilePreview", "autoSave",
      "verbose", "compactMode", "showTimestamps", "autoCommit", "autoFormat",
      "cacheResponses", "streamingMode", "debugMode", "quietMode", "smartContext",
      "deepAnalysis"].includes(key)) {
      settings[key] = boolVal;
    } else {
      console.log(`${c.red}✗${c.reset} Unknown setting: ${c.yellow}${key}${c.reset}\n`);
      return;
    }

    await saveSettings(settings);
    console.log(`${c.green}✓${c.reset} ${c.cyan}${key}${c.reset} = ${c.yellow}${value}${c.reset}\n`);
  } else {
    showSettings(context.settings);
  }
}
