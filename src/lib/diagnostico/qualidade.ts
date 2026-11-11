// Regras de qualidade das respostas do diagnóstico. Funções puras, sem banco nem IA.
//
// Dois níveis, de propósito:
//  - PROBLEMA (bloqueia): a resposta claramente não é um texto (letras repetidas, teclado
//    "amassado", só repetição). A pessoa corrige na hora, na própria pergunta.
//  - AVISO (não bloqueia): a resposta é um texto, mas parece fugir do que a pergunta pediu
//    (qualidades em vez de ações, aulas quando a pergunta é "fora da sala", contradição entre
//    duas respostas). Aparece na tela de conferência antes de gerar, com a saída "seguir assim".
import type { RotaProfissional } from "@/generated/prisma/client";
import { deepGet } from "@/lib/wizard/deep-set";
import { getStepBySlug } from "./steps";

export const MARCADOR_SEM_RESPOSTA = "__SEM_RESPOSTA__";

// Minúsculas, sem acento e só com letras, números e espaços simples.
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function palavrasDe(texto: string): string[] {
  const n = normalizar(texto);
  return n ? n.split(" ") : [];
}

// ---------- Problemas (bloqueiam) ----------

// Palavra "ruim": sem nenhuma vogal ou com 6+ consoantes seguidas. Em português isso só acontece
// em teclado amassado ("kjhkjhkj", "sdfghjk").
function palavraSuspeita(p: string): boolean {
  if (p.length < 3 || !/^[a-z]+$/.test(p)) return false;
  return !/[aeiouy]/.test(p) || /[bcdfghjklmnpqrstvwxz]{6,}/.test(p);
}

// null = tudo certo. Só deve ser usada onde há mínimo de caracteres: nesses campos a pessoa precisa
// escrever de verdade, então texto sem sentido não pode servir só para bater o mínimo.
export function problemaNoTexto(texto: string, minChars?: number): string | null {
  const bruto = texto.trim();
  if (!bruto) return null;

  if (/(.)\1{5,}/u.test(bruto)) {
    return "Há um trecho com o mesmo caractere repetido. Escreva a resposta com as suas palavras, em frases.";
  }

  const palavras = palavrasDe(bruto);
  if (minChars) {
    const minimoDePalavras = Math.max(3, Math.floor(minChars / 14));
    if (palavras.length < minimoDePalavras) {
      return `Escreva em frases, com pelo menos ${minimoDePalavras} palavras. Os caracteres sozinhos não bastam: queremos entender o que você quis dizer.`;
    }
  }
  if (palavras.length >= 8 && new Set(palavras).size / palavras.length < 0.45) {
    return "A resposta repete as mesmas palavras várias vezes. Conte com detalhes diferentes o que aconteceu ou o que você faz.";
  }
  const longas = palavras.filter((p) => p.length >= 3);
  if (longas.length >= 4 && longas.filter(palavraSuspeita).length / longas.length >= 0.4) {
    return "Não consegui reconhecer essa resposta como um texto. Escreva com as suas palavras, em frases.";
  }
  return null;
}

// Palavras que sozinhas não dizem o que a pessoa fez. Sobrando no máximo uma palavra "de conteúdo",
// a ação é vazia ("ajudei a organizar e dei apoio a todos").
const PALAVRAS_VAZIAS = new Set([
  "ajudei", "ajudar", "ajudamos", "ajudando", "ajuda", "participei", "participar", "participando",
  "apoiei", "apoiar", "apoio", "suporte", "colaborei", "colaborar", "contribui", "contribuir",
  "auxiliei", "auxiliar", "acompanhei", "acompanhar", "atuei", "atuar", "trabalhei", "trabalhar",
  "fazer", "fazendo", "tudo", "todos", "todas", "muito", "bastante", "sempre", "equipe", "time",
  "grupo", "pessoas", "coisas", "tambem", "junto", "juntos", "processo", "processos", "forma",
  "geral", "algo", "varias", "varios", "envolvidos", "demais", "colegas", "mais", "meio", "para",
  "pelo", "pela", "como", "quando", "onde", "isso", "essa", "esse", "dando", "dava", "demos",
  "todo", "tempo", "vezes", "momento", "momentos",
]);

export function acaoSemSubstancia(texto: string): boolean {
  const conteudo = palavrasDe(texto).filter((p) => p.length >= 4 && !PALAVRAS_VAZIAS.has(p));
  return conteudo.length <= 1;
}

// ---------- Meta financeira ----------

export type MetaFinanceira = { minimo: number; maximo: number; anual: boolean };

// Lê "R$ 5.000", "entre R$ 4.000 e R$ 6.000", "5 mil", "4 a 6 mil", "5k", "R$ 4.000,50".
// null = não achou nenhum valor (a pessoa escreveu algo como "o que der").
export function lerMetaFinanceira(texto: string): MetaFinanceira | null {
  const n = texto.toLowerCase().replace(/r\$/g, " ");
  const re = /(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)(\s*(?:mil|k)\b)?/g;
  const achados: { valor: number; multiplicador: boolean }[] = [];
  for (const m of n.matchAll(re)) {
    const bruto = m[1];
    const comMilhares = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(bruto);
    const valor = Number(comMilhares ? bruto.replace(/\./g, "").replace(",", ".") : bruto.replace(",", "."));
    if (Number.isNaN(valor)) continue;
    achados.push({ valor, multiplicador: Boolean(m[2]) });
    if (achados.length === 2) break;
  }
  if (achados.length === 0) return null;

  const valores = achados.map((a) => (a.multiplicador ? a.valor * 1000 : a.valor));
  // "entre 4 e 6 mil": o "mil" vale para os dois números.
  if (achados.length === 2 && achados[1].multiplicador && !achados[0].multiplicador && achados[0].valor < 1000) {
    valores[0] = achados[0].valor * 1000;
  }
  return {
    minimo: Math.min(...valores),
    maximo: Math.max(...valores),
    anual: /\b(ano|anual|anuais|por ano)\b/.test(normalizar(texto)),
  };
}

// ---------- Avisos (não bloqueiam) ----------

export type AvisoDeQualidade = { slug: string; motivo: string };

const TERMOS_DE_SALA: RegExp[] = [
  /\balunos?\b/, /\balunas?\b/, /\bsala de aula\b/, /\bturmas?\b/, /\bdar aulas?\b/,
  /\bminhas aulas\b/, /\bplanejamento de aulas?\b/, /\bprovas?\b/, /\bdiario de classe\b/,
];

const QUALIDADES = [
  "criativ", "responsav", "dedicad", "comunicativ", "pacient", "proativ", "empatic", "comprometid",
  "esforcad", "determinad", "resilient", "flexivel", "organizad", "atencios", "honest", "dinamic",
];

const CONSUMO = /\b(cursos?|assisti|assisto|assistindo|videos?|podcasts?|youtube|lendo|palestras?|webinars?|li livros?)\b/;
const TRABALHO = /\b(trabalhei|vendi|criei|montei|organizei|atendi|coordenei|gerenciei|lancei|abri|tive|fui|fiz|prestei|cobrei|contratei|produzi|ministrei|liderei|conduzi|desenvolvi|cuidei)\b/;
const GENERICAS_DE_APRENDER = ["aprender mais", "de tudo", "qualquer coisa", "nao sei", "coisas novas", "tudo um pouco"];

const FORMATOS_DE_EMPREGO = ["empresa_privada", "setor_publico", "organizacao_social"];
const FORMATOS_DE_ATUACAO_PROPRIA = [
  "autonomo", "projeto", "consultoria", "produto_proprio", "negocio_proprio", "conteudo", "ferramenta_digital",
];

export function avisosDeQualidade(
  answers: Record<string, unknown>,
  rota: RotaProfissional | null | undefined,
): AvisoDeQualidade[] {
  const avisos: AvisoDeQualidade[] = [];
  const resposta = (slug: string): unknown => {
    const step = getStepBySlug(slug, rota);
    return step && step.type !== "intention" ? deepGet(answers, step.path) : undefined;
  };
  const texto = (slug: string): string => {
    const v = resposta(slug);
    return typeof v === "string" && v !== MARCADOR_SEM_RESPOSTA ? v.trim() : "";
  };
  const lista = (slug: string): string[] => {
    const v = resposta(slug);
    return Array.isArray(v) ? (v as string[]) : [];
  };

  const ajuda = normalizar(texto("ajuda-procurada"));
  if (ajuda && TERMOS_DE_SALA.filter((t) => t.test(ajuda)).length >= 2) {
    avisos.push({
      slug: "ajuda-procurada",
      motivo: "A pergunta pede a ajuda que procuram em você fora da sala de aula, e a resposta parece falar de aulas e alunos.",
    });
  }

  const experiencias = normalizar(texto("experiencias-alem-docencia"));
  if (experiencias && CONSUMO.test(experiencias) && !TRABALHO.test(experiencias)) {
    avisos.push({
      slug: "experiencias-alem-docencia",
      motivo: "Cursos, vídeos e leituras mostram interesse, mas não são experiência. Se houve algo que você fez de fato, vale contar.",
    });
  }

  const contribuicao = normalizar(texto("contribuicao-diferenciada"));
  if (contribuicao) {
    const qualidades = QUALIDADES.filter((q) => contribuicao.includes(q)).length;
    if (qualidades >= 2 || (/^(eu )?sou /.test(contribuicao) && qualidades >= 1)) {
      avisos.push({
        slug: "contribuicao-diferenciada",
        motivo: "A resposta descreve qualidades. A pergunta pede o que você faz, uma ação que dê para observar.",
      });
    }
  }

  const aprender = normalizar(texto("aprendizado-desejado"));
  if (aprender && aprender.length < 160 && GENERICAS_DE_APRENDER.some((g) => aprender.includes(g))) {
    avisos.push({
      slug: "aprendizado-desejado",
      motivo: "A resposta está genérica. Cite algo específico: uma ferramenta, uma técnica ou uma área de conhecimento.",
    });
  }

  const metaTexto = texto("meta-financeira-mensal");
  if (metaTexto) {
    const meta = lerMetaFinanceira(metaTexto);
    if (!meta) {
      avisos.push({ slug: "meta-financeira-mensal", motivo: "Não encontrei um valor em reais na sua meta mensal." });
    } else if (meta.anual) {
      avisos.push({
        slug: "meta-financeira-mensal",
        motivo: "A pergunta é sobre o valor por mês, e a resposta parece falar de valor por ano.",
      });
    } else if (meta.maximo < 1500) {
      avisos.push({
        slug: "meta-financeira-mensal",
        motivo: "O valor ficou baixo para uma meta mensal. Confira se é por mês e líquido.",
      });
    } else if (meta.minimo > 50000) {
      avisos.push({
        slug: "meta-financeira-mensal",
        motivo: "O valor ficou muito alto para uma meta mensal. Confira se é por mês e líquido.",
      });
    }
  }

  const preferencias = resposta("preferencias-estruturais") as Record<string, string> | undefined;
  if (preferencias) {
    const niveis = Object.values(preferencias).filter(Boolean);
    if (niveis.length >= 6 && new Set(niveis).size === 1) {
      avisos.push({
        slug: "preferencias-estruturais",
        motivo:
          niveis[0] === "nao_aceito"
            ? 'Você marcou "Não aceito" em tudo. Cada "Não aceito" tira possibilidades da lista, então vale marcar só o que realmente não aceita.'
            : "Você marcou a mesma resposta em todas as condições. Confira se é isso mesmo, porque elas ajudam a filtrar as possibilidades.",
      });
    }
  }

  const formatos = lista("formatos-aceitos");
  if (formatos.length > 0) {
    if (rota === "CARREIRA" && !formatos.some((f) => FORMATOS_DE_EMPREGO.includes(f))) {
      avisos.push({
        slug: "formatos-aceitos",
        motivo: "Você buscou uma nova carreira, mas nos formatos de trabalho não marcou nenhum emprego ou vínculo.",
      });
    }
    if (rota === "CRIACAO_VALOR" && !formatos.some((f) => FORMATOS_DE_ATUACAO_PROPRIA.includes(f))) {
      avisos.push({
        slug: "formatos-aceitos",
        motivo: "Você quer criar uma atuação própria, mas nos formatos de trabalho marcou só empregos e locais de trabalho.",
      });
    }
  }

  const construcao = resposta("criacao-forma-construcao");
  if (
    (construcao === "sozinho_pequeno" || construcao === "sozinho_crescer") &&
    preferencias?.trabalhoSozinho === "nao_aceito"
  ) {
    avisos.push({
      slug: "preferencias-estruturais",
      motivo: 'Você disse que pretende começar sozinho, mas marcou que não aceita "Trabalho predominantemente sozinho".',
    });
  }

  return avisos;
}
