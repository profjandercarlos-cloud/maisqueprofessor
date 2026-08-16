import type { ObstacleCategory } from "@/generated/prisma/client";

// Transcrito literalmente de Biblioteca_Orientacao_Execucao.md, Parte 1.
// Conteúdo fixo e curado — a IA (Haiku) só reescreve o tom, nunca gera
// conselho novo. Revisão trimestral sugerida no documento fonte.
export const OBSTACLE_LABELS: Record<ObstacleCategory, string> = {
  FALTA_DE_TEMPO: "Falta de tempo",
  FALTA_DE_INVESTIMENTO: "Falta de investimento",
  DIFICULDADE_TECNICA: "Dificuldade técnica (não sabe como fazer)",
  FALTA_DE_MOTIVACAO: "Falta de motivação ou procrastinação",
  INSEGURANCA_OU_MEDO: "Insegurança ou medo de errar/expor",
  IMPREVISTO_PESSOAL_OU_EXTERNO: "Imprevisto pessoal ou externo",
  NAO_HOUVE_OBSTACULO: "Não houve obstáculo",
};

export const GUIDANCE_LIBRARY: Record<ObstacleCategory, string[]> = {
  FALTA_DE_TEMPO: [
    "Reduza a tarefa da semana pela metade antes de desistir dela inteira — fazer uma versão pequena mantém o ritmo, e ritmo importa mais que volume.",
    'Escolha um horário fixo e curto (15-20 minutos) para essa etapa, em vez de esperar um "tempo livre" que raramente aparece sozinho.',
    "Se a semana realmente não coube, isso não é uma falha — é exatamente para isso que existe a recalibração. Ajuste o prazo, não abandone.",
  ],
  FALTA_DE_INVESTIMENTO: [
    "Pergunte-se: existe uma versão desta etapa que custa menos, mesmo que mais trabalhosa? Quase sempre existe.",
    "Um teste pequeno, feito com o que você já tem, vale mais do que esperar juntar o valor ideal.",
    "Se o investimento necessário parece alto demais para essa fase, pode ser sinal de que a etapa precisa ser quebrada em uma parte anterior, mais barata.",
  ],
  DIFICULDADE_TECNICA: [
    "Você não precisa saber fazer perfeitamente — precisa saber fazer o suficiente para testar se faz sentido continuar.",
    "Buscar um tutorial rápido e gratuito antes de travar de vez costuma resolver mais rápido do que parece.",
    "Se a dificuldade for grande, permita-se registrar isso como aprendizado real desta semana, mesmo sem ter avançado a tarefa em si.",
  ],
  FALTA_DE_MOTIVACAO: [
    "Comece pela menor parte possível da tarefa — o primeiro passo pequeno costuma destravar o resto.",
    'Relembre por que esse caminho apareceu para você (releia o "por que apareceu" do seu relatório) antes de decidir pular a semana.',
    "Motivação costuma vir depois da ação, não antes — às vezes vale começar mesmo sem vontade, só pra ver o que acontece.",
  ],
  INSEGURANCA_OU_MEDO: [
    "O primeiro teste de qualquer caminho não precisa ser público ou definitivo — ele existe só para você aprender algo.",
    "Errar nesta fase é informação, não fracasso — é exatamente o que o plano foi desenhado para revelar cedo.",
    "Se o medo é de mostrar algo para outra pessoa, considere um primeiro teste que envolva só você, antes de expor.",
  ],
  IMPREVISTO_PESSOAL_OU_EXTERNO: [
    "Nem toda semana precisa avançar — o plano se ajusta ao seu tempo, não o contrário.",
    "Se o imprevisto for maior, considere pausar o plano ativo (nas configurações) até se sentir pronto para retomar, sem culpa.",
  ],
  NAO_HOUVE_OBSTACULO: [
    "Ótimo ritmo — vale registrar no diário o que funcionou bem essa semana, para repetir.",
    "Se sobrou tempo ou energia, use para adiantar um pouco da próxima etapa, sem se cobrar por isso.",
  ],
};

// Alterna entre as dicas da categoria conforme quantas vezes ela já apareceu
// para essa pessoa, para não repetir sempre a mesma (ver nota sobre variar a
// abertura da mensagem, Parte 2 do documento).
export function selectBaseTip(category: ObstacleCategory, previousOccurrences: number): string {
  const tips = GUIDANCE_LIBRARY[category];
  return tips[previousOccurrences % tips.length];
}
