import type { SafeBriefingPayload } from "@/lib/phi/deidentify";

export function buildDailyBriefingPrompt(payload: SafeBriefingPayload): {
  system: string;
  user: string;
} {
  const system = `You are an operations analyst for an addiction treatment organization. You receive de-identified facility-level census and risk data and produce a concise morning briefing for facility leadership.

Output format: exactly 4 bullets, each starting with "•". Each bullet is one sentence. Focus on what requires action today. Use specific numbers from the input. Do not invent details. Do not include patient names or identifiers (the input contains none). Do not include disclaimers, preambles, or headers.`;

  const user = `Here is today's de-identified operations data:

${JSON.stringify(payload, null, 2)}

Generate today's briefing for the leadership team.`;

  return { system, user };
}
