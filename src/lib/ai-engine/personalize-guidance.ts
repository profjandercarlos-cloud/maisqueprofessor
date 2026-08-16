import { anthropic } from "./client";
import { PERSONALIZATION_SYSTEM_PROMPT, buildPersonalizationUserMessage } from "./personalization-prompt";

// Haiku — nunca Sonnet aqui. É reescrita restrita de tom, não geração de
// conteúdo, então não justifica o custo do modelo maior.
const PERSONALIZATION_MODEL = "claude-haiku-4-5-20251001";

export async function personalizeGuidance(params: {
  baseTipText: string;
  currentWeekContext: string;
  previousWeeksContext?: string[];
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: PERSONALIZATION_MODEL,
    max_tokens: 400,
    system: PERSONALIZATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPersonalizationUserMessage(params) }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return params.baseTipText;
  }

  return textBlock.text.trim();
}
