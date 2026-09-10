export type CriteriosDecisao = {
  perguntas: string[];
  regra_avancar: string;
  regra_ajustar: string;
  regra_encerrar: string;
};

export type Relatorio = {
  quem_aparece: string;
  padroes_que_se_repetem: string;
  por_que_esse_caminho: string;
  ja_possui_vs_aprender: string;
  ponto_de_atencao: string;
  // Campos do "resumo do experimento" e da decisão final — ver análise
  // "Executabilidade do Plano". Renderizados em blocos próprios na tela do
  // plano (não entram no loop genérico de REPORT_SECTIONS abaixo).
  hipotese_de_teste: string;
  entregas_finais: string[];
  condicao_de_termino: string;
  criterios_decisao: CriteriosDecisao;
};

// Só as 5 seções de texto livre original — os campos novos (resumo do
// experimento, critérios de decisão) têm blocos de exibição próprios,
// então o tipo da chave aqui fica restrito a eles de propósito (evita
// section.key apontar pra um campo que não é string, como entregas_finais
// ou criterios_decisao).
type ReportSectionKey = "quem_aparece" | "padroes_que_se_repetem" | "por_que_esse_caminho" | "ja_possui_vs_aprender" | "ponto_de_atencao";

export const REPORT_SECTIONS: { key: ReportSectionKey; label: string }[] = [
  { key: "quem_aparece", label: "Quem aparece por trás do professor" },
  { key: "padroes_que_se_repetem", label: "Os padrões que se repetem" },
  { key: "por_que_esse_caminho", label: "Por que esse caminho faz sentido pra você" },
  { key: "ja_possui_vs_aprender", label: "O que já possui vs. o que precisa aprender" },
  { key: "ponto_de_atencao", label: "Principal ponto de atenção" },
];
