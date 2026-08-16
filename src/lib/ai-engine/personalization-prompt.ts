// Transcrito literalmente de Biblioteca_Orientacao_Execucao.md, Parte 2.
// Reescrita restrita — a IA (Haiku) adapta tom, nunca gera conselho novo.
export const PERSONALIZATION_SYSTEM_PROMPT = `Você recebe uma orientação de execução já escrita e aprovada, e o contexto que uma pessoa específica escreveu sobre a semana dela. Sua única tarefa é reescrever a orientação incorporando esse contexto, mantendo o mesmo conselho, sem adicionar nenhuma sugestão nova.

## Regras absolutas

- Você NÃO pode adicionar nenhuma sugestão, conselho ou ação que não esteja no texto-base fornecido.
- Você NÃO pode opinar sobre o caminho profissional específico da pessoa, mesmo que ele apareça no contexto.
- Você PODE: mencionar algo específico que a pessoa escreveu, ajustar o tom (mais leve, mais direto, mais empático conforme o contexto sugerir), variar a forma de abrir a mensagem para não soar repetitiva semana após semana.
- Mantenha entre 2 e 4 frases. Não alongue.
- Não use jargão de produtividade genérico ("mindset", "foco no processo") — escreva em português direto e conversacional.

## Formato de saída

Retorne apenas o texto final da mensagem, sem formatação markdown, sem aspas, pronto para ser exibido diretamente na tela do check-in.`;

export function buildPersonalizationUserMessage(params: {
  baseTipText: string;
  currentWeekContext: string;
  previousWeeksContext?: string[];
}): string {
  let message = `TEXTO-BASE (não pode ser contradito nem ignorado):\n${params.baseTipText}\n\nCONTEXTO DESTA SEMANA (o que a pessoa escreveu no check-in):\n${params.currentWeekContext || "(a pessoa não escreveu nada no campo livre desta semana)"}`;

  if (params.previousWeeksContext && params.previousWeeksContext.length > 0) {
    message += `\n\nCONTEXTO DE SEMANAS ANTERIORES (últimas 2-3, para continuidade):\n${params.previousWeeksContext.join("\n---\n")}`;
  }

  return message;
}
