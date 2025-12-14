import { KEY } from "../config/constants.mjs";

export const usageStats = {
  prompt_tokens: 0,
  completion_tokens: 0,
  cost: 0.0
};

export async function pplx(messages, { temperature = undefined, model = undefined, settings } = {}) {
  const temp = temperature ?? settings.temperature;
  const useModel = model ?? settings.model;

  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: useModel, messages, temperature: temp })
  });

  const j = await r.json();
  if (!r.ok) {
    throw new Error(`API Error: ${j?.error?.message ?? "Unknown error"}`);
  }
  
  const text = j?.choices?.[0]?.message?.content ?? JSON.stringify(j);
  
  if (j && j.usage) {
    usageStats.prompt_tokens += j.usage.prompt_tokens || 0;
    usageStats.completion_tokens += j.usage.completion_tokens || 0;
    // Approx cost: $3/M input, $15/M output (Sonar Pro estimate, varies)
    const cost = ((j.usage.prompt_tokens || 0) / 1000000 * 3) + ((j.usage.completion_tokens || 0) / 1000000 * 15);
    usageStats.cost += cost;
  } else {
    // Estimate
    const pLen = JSON.stringify(messages).length / 4;
    const rLen = text.length / 4;
    usageStats.prompt_tokens += pLen;
    usageStats.completion_tokens += rLen;
  }
  
  return { text, raw: j };
}
