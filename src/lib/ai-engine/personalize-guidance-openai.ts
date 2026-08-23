import { openai } from "./openai-client";
import { PERSONALIZATION_SYSTEM_PROMPT, buildPersonalizationUserMessage } from "./personalization-prompt";

// "Luna" — nível rápido/econômico da família GPT-5.6. Reescrita restrita de
// tom (não gera conselho novo), tarefa leve — não precisa do modelo maior.
const PERSONALIZATION_MODEL = "gpt-5.6-luna";

export async function personalizeGuidanceOpenAI(params: {
  baseTipText: string;
  currentWeekContext: string;
  previousWeeksContext?: string[];
}): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: PERSONALIZATION_MODEL,
    max_completion_tokens: 400,
    messages: [
      { role: "system", content: PERSONALIZATION_SYSTEM_PROMPT },
      { role: "user", content: buildPersonalizationUserMessage(params) },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  return text || params.baseTipText;
}
