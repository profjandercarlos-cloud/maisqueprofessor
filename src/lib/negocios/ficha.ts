// Ficha do professor: o texto que o professor LÊ sobre um Pequeno Negócio.
// O registro pesquisado (PequenoNegocio) continua sendo a base de auditoria; a
// ficha é a versão em linguagem simples, gerada a partir dele e revisada no admin.
//
// Os "números" (horas, investimento, prazo, preparo) NÃO são gerados por IA:
// saem direto do registro (numerosDaFicha), para a IA nunca inventar número.
import { z } from "zod";

export const FICHA_VERSAO = 1;

const lista = (min: number, max: number) => z.array(z.string().min(1)).min(min).max(max);

export const fichaSchema = z.object({
  versao: z.literal(FICHA_VERSAO),
  vende: z.string().min(1),
  paraQuem: z.string().min(1),
  quando: z.string().min(1),
  porque: lista(2, 4),
  preco: z.object({
    referencia: z.string().min(1),
    aviso: z.string().min(1).nullable(),
    sugestao: z.string().min(1),
    // true quando a "sugestão" é número nosso, não da pesquisa — a tela avisa.
    estimativa: z.boolean(),
    conta: z.string().min(1).nullable(),
  }),
  preparar: lista(2, 5),
  comeco: z.object({
    fazer: z.string().min(1),
    cliente: z.string().min(1),
    depois: z.string().min(1),
  }),
  cresce: z.object({
    c0: z.string().min(1),
    c1: z.string().min(1),
    c5: z.string().min(1),
    alem: z.string().min(1),
  }),
  // O prompt pede 3 a 8; o teto aqui é maior porque a linha do MEI é acrescentada
  // DEPOIS (comLinhaMei). Com teto 8, uma ficha de 8 virava 9 e era rejeitada na leitura.
  cuidados: lista(3, 12),
  // Amostra do formato do plano de execução (semana 1) — vai no fim da ficha
  // para mostrar o TIPO de estrutura do plano pago, sem entregá-lo.
  amostraPlano: z.object({
    titulo: z.string().min(1),
    tarefa: z.string().min(1),
    feitoQuando: z.string().min(1),
  }),
});

export type FichaProfessor = z.infer<typeof fichaSchema>;

// Lê o JSON do banco com segurança: ficha antiga/corrompida vira null (a página
// trata como "sem ficha") em vez de quebrar a tela.
export function lerFicha(valor: unknown): FichaProfessor | null {
  const r = fichaSchema.safeParse(valor);
  return r.success ? r.data : null;
}

// Linha obrigatória quando o enquadramento como MEI não foi verificado.
export const LINHA_MEI_NAO_VERIFICADO =
  "Ainda não verificamos o enquadramento como MEI. Antes de crescer, converse com um contador.";

export function comLinhaMei(ficha: FichaProfessor, enquadramentoMei: string): FichaProfessor {
  if (enquadramentoMei !== "nao_verificado") return ficha;
  if (ficha.cuidados.some((c) => /\bMEI\b/.test(c))) return ficha;
  return { ...ficha, cuidados: [...ficha.cuidados, LINHA_MEI_NAO_VERIFICADO] };
}

// --- Números: vêm do registro, nunca da IA -----------------------------------

export type NegocioParaNumeros = {
  tagPreparo: string;
  horasSemanaisMin: number | null;
  horasSemanaisMax: number | null;
  formasDeComecar: unknown;
};

export type NumerosDaFicha = {
  horas: string;
  investimento: string;
  primeiroCliente: string;
  preparo: string;
};

const PREPARO_LABELS: Record<string, string> = {
  comeca_ja: "Pode começar já",
  precisa_curso_curto: "Exige um curso curto",
  precisa_licenca_ou_registro: "Exige licença ou registro antes de vender",
};

const NAO_INFORMADO = "Não informado";

function reais(n: number): string {
  return `R$ ${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`;
}

export function numerosDaFicha(n: NegocioParaNumeros): NumerosDaFicha {
  const formas = Array.isArray(n.formasDeComecar) ? (n.formasDeComecar as Record<string, unknown>[]) : [];
  const forma1 = formas.find((f) => f.ordem === 1);

  const { horasSemanaisMin: hMin, horasSemanaisMax: hMax } = n;
  const horas =
    hMin == null && hMax == null
      ? NAO_INFORMADO
      : hMin != null && hMax != null && hMin !== hMax
        ? `${hMin} a ${hMax} h por semana`
        : `${hMin ?? hMax} h por semana`;

  const inv = forma1?.investimentoInicialBrl as { min?: number | null; max?: number | null } | null | undefined;
  const investimento =
    inv?.min == null && inv?.max == null
      ? NAO_INFORMADO
      : inv?.min != null && inv?.max != null && inv.min !== inv.max
        ? `${reais(inv.min)} a ${reais(inv.max)}`
        : reais((inv?.min ?? inv?.max) as number);

  // "Hipótese, não prazo observado nem garantia: 2 a 4 semanas após preparo." → só o prazo.
  const bruto = typeof forma1?.tempoAtePrimeiraVendaHipotese === "string" ? forma1.tempoAtePrimeiraVendaHipotese : "";
  const prazo = bruto.includes(":") ? bruto.slice(bruto.indexOf(":") + 1).trim().replace(/\.$/, "") : bruto.trim();
  const primeiroCliente = prazo ? `${prazo} (hipótese)` : NAO_INFORMADO;

  return {
    horas,
    investimento,
    primeiroCliente,
    preparo: PREPARO_LABELS[n.tagPreparo] ?? NAO_INFORMADO,
  };
}
