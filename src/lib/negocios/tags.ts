// Vocabulário das etiquetas dos Pequenos Negócios. Os valores são os que o
// prompt de pesquisa permite (validados 100% na importação); os rótulos são
// só pra tela do admin. Texto no banco (não enum) de propósito: ajustar o
// vocabulário não exige migração.
export const CATEGORIA_LABELS: Record<string, string> = {
  ENSINAR_E_DESENVOLVER: "Ensinar e desenvolver pessoas",
  FAZER_OU_PRODUZIR: "Fazer ou produzir coisas",
  CUIDAR: "Cuidar de pessoas, animais e espaços",
  ORGANIZAR_E_RESOLVER: "Organizar e resolver para o cliente",
  COMUNICAR_E_VENDER: "Comunicar e vender",
  TECNOLOGIA: "Criar e operar tecnologia",
  CONECTAR: "Conectar pessoas e oportunidades",
};

export const CATEGORIA_ORDEM = Object.keys(CATEGORIA_LABELS);

export const TAG_LABELS: Record<string, Record<string, string>> = {
  onde: {
    casa_do_professor: "Da própria casa",
    no_cliente: "No cliente",
    no_bairro: "No bairro",
    online: "Online",
    espaco_proprio: "Espaço próprio",
  },
  quemExecuta: { so_eu: "Só eu", com_ajudante: "Com ajudante", com_equipe: "Com equipe" },
  preparo: {
    comeca_ja: "Começa já",
    precisa_curso_curto: "Precisa de curso curto",
    precisa_licenca_ou_registro: "Precisa de licença ou registro",
  },
  investimentoInicial: { baixo: "Baixo (até R$ 500)", medio: "Médio (R$ 500 a 3.000)", alto: "Alto (R$ 3.000 a 10.000)" },
  escala: { renda_extra: "Renda extra", negocio_local: "Negócio local", pode_virar_empresa: "Pode virar empresa" },
  retorno: { rapido: "Rápido (até 4 semanas)", medio_prazo: "Médio prazo (1 a 3 meses)", longo_prazo: "Longo prazo" },
  receita: { avulsa: "Avulsa", recorrente: "Recorrente", comissao: "Comissão", assinatura: "Assinatura", produto: "Produto" },
  cliente: { pessoa_fisica: "Pessoa física", empresa: "Empresa", condominio_ou_bairro: "Condomínio ou bairro" },
  mei: {
    permitido_confirmado_em_fonte_oficial: "MEI confirmado em fonte oficial",
    nao_permitido: "MEI não permitido",
    nao_verificado: "MEI não verificado",
  },
};

export const FORMA_TIPO_LABELS: Record<string, string> = {
  prestacao_de_servico: "Prestação de serviço",
  produto_minimo: "Produto mínimo",
  parceria: "Parceria",
  revenda: "Revenda",
  piloto_pago: "Piloto pago",
  negocio_proprio_enxuto: "Negócio próprio enxuto",
};

export const HABILIDADE_LABELS: Record<string, string> = {
  organizacao: "Organização",
  comunicacao_didatica: "Comunicação didática",
  escrita: "Escrita",
  analise_numeros: "Análise de números",
  relacionamento: "Relacionamento",
  tecnologia: "Tecnologia",
  operacao_pratica: "Operação prática",
  criatividade: "Criatividade",
  pesquisa: "Pesquisa",
};

export const EVIDENCIA_LABELS: Record<string, string> = {
  OFERTA_PUBLICADA: "Oferta publicada",
  VENDA_PUBLICA_VISIVEL: "Venda pública visível",
  PEDIDO_DOCUMENTADO: "Pedido documentado",
  SELECAO_CONCLUIDA: "Seleção concluída",
  CONTRATO_COM_VALOR: "Contrato com valor",
  PILOTO_PAGO_DO_PROFESSOR: "Piloto pago pelo professor",
};
