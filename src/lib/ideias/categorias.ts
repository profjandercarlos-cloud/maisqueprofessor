// As 7 categorias do repositório "Ideias de negócios para professores". Fixas
// (vêm do arquivo importado, com ids cat_01..cat_07), por isso ficam no código
// e não numa tabela. `curto` aparece nos chips; `descricao` é a linha que
// explica a categoria escolhida, porque os nomes não são óbvios para quem chega.
export type CategoriaIdeia = {
  id: string;
  nome: string;
  curto: string;
  descricao: string;
};

export const CATEGORIAS_IDEIAS: CategoriaIdeia[] = [
  {
    id: "cat_01",
    nome: "Ensino, formação e desenvolvimento de pessoas",
    curto: "Ensino",
    descricao:
      "Escolas e centros que ensinam pessoas e equipes: idiomas, comunicação, dados, concursos, reforço e formação de profissionais.",
  },
  {
    id: "cat_02",
    nome: "Conteúdo, design e produção editorial",
    curto: "Conteúdo e design",
    descricao:
      "Empresas que produzem materiais: apresentações, vídeos, textos, livros, design e tradução, para empresas e especialistas.",
  },
  {
    id: "cat_03",
    nome: "Marketing, vendas e relacionamento com clientes",
    curto: "Marketing e vendas",
    descricao:
      "Empresas que ajudam outras a vender e a se comunicar com clientes: anúncios, redes sociais, vendas, parcerias e relacionamento.",
  },
  {
    id: "cat_04",
    nome: "Organização, gestão e apoio operacional",
    curto: "Organização e gestão",
    descricao:
      "Empresas que assumem a organização e a rotina de outras: projetos, secretaria, finanças, documentos, compras e contratos.",
  },
  {
    id: "cat_05",
    nome: "Pesquisa, dados e apoio à decisão",
    curto: "Pesquisa e dados",
    descricao:
      "Empresas que ajudam a decidir com dados: pesquisas, estudos de viabilidade, análises de vendas, preços e fornecedores.",
  },
  {
    id: "cat_06",
    nome: "Tecnologia, automação e soluções digitais",
    curto: "Tecnologia",
    descricao:
      "Empresas que criam e mantêm soluções digitais: sites, aplicativos, automações, sistemas, suporte e segurança digital.",
  },
  {
    id: "cat_07",
    nome: "Eventos, experiências e comunidades",
    curto: "Eventos e comunidades",
    descricao:
      "Empresas que organizam encontros e experiências: eventos, congressos, feiras, comunidades, festivais e rodadas de negócios.",
  },
];

const POR_ID = new Map(CATEGORIAS_IDEIAS.map((c) => [c.id, c]));

export function categoriaDaIdeia(id: string): CategoriaIdeia | undefined {
  return POR_ID.get(id);
}

export function categoriaValida(id: string): boolean {
  return POR_ID.has(id);
}
