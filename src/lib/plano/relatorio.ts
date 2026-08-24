export type Relatorio = {
  quem_aparece: string;
  padroes_que_se_repetem: string;
  por_que_esse_caminho: string;
  ja_possui_vs_aprender: string;
  ponto_de_atencao: string;
};

export const REPORT_SECTIONS: { key: keyof Relatorio; label: string }[] = [
  { key: "quem_aparece", label: "Quem aparece por trás do professor" },
  { key: "padroes_que_se_repetem", label: "Os padrões que se repetem" },
  { key: "por_que_esse_caminho", label: "Por que esse caminho faz sentido pra você" },
  { key: "ja_possui_vs_aprender", label: "O que já possui vs. o que precisa aprender" },
  { key: "ponto_de_atencao", label: "Principal ponto de atenção" },
];
