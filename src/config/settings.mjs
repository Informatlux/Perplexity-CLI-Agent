import fs from "node:fs/promises";
import { SETTINGS_FILE } from "./constants.mjs";

export async function loadSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {
      model: "sonar-pro",
      temperature: 0.2,
      editTemp: 0.2,
      maxHistory: 10,
      autoContext: true,
      syntax: true,
      askPermission: true,
      autoSuggest: true,
      gitIntegration: true,
      conversationalMode: false,
      smartFileDetection: true,
      maxFilesPerQuery: 8,
      showFilePreview: true,
      autoSave: false,
      colorScheme: "vibrant",
      verbose: false,
      compactMode: false,
      showTimestamps: false,
      autoCommit: false,
      autoFormat: true,
      cacheResponses: false,
      streamingMode: false,
      debugMode: false,
      quietMode: false,
      smartContext: true,
      deepAnalysis: false,
      role: "",
      aliases: {}
    };
  }
}

export async function saveSettings(settings) {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
}
