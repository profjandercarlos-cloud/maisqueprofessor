// Conteúdo de uma ideia de negócio como o professor lê: os 5 blocos do arquivo
// importado (ver "mapa_campos" em src/data/repositorio-ideias.json):
//   1. nome e resumo   2. o que a empresa faz   3. por que merece atenção
//   4. primeiro serviço   5. onde pode chegar em cinco anos (com a simulação financeira)
//
// Os NÚMEROS (horas, preços, custos, resultado) vêm sempre do arquivo original e
// nunca passam pela IA: ela só reescreve texto (ver aplicarTextos).
import { z } from "zod";

export const CONTEUDO_VERSAO = 1;

const texto = z.string().min(1);

export const conteudoSchema = z.object({
  versao: z.literal(CONTEUDO_VERSAO),
  nome: texto,
  resumo: texto,
  empresaFaz: z.object({
    descricao: texto,
    exemplo: texto,
    focoLucratividade: texto,
  }),
  porqueAtencao: z.array(texto).min(1).max(4),
  primeiroServico: z.object({
    oferta: texto,
    plano: texto,
    observacaoEscopo: texto.nullable(),
  }),
  cincoAnos: z.object({
    marcos: z.array(z.object({ etapa: texto, descricao: texto })).min(1).max(5),
    estrutura: texto,
    horasSemana: z.object({ minimo: z.number(), maximo: z.number() }),
    premissas: texto,
    simulacao: z.object({
      receitas: z
        .array(
          z.object({
            descricao: texto,
            quantidade: z.number(),
            periodicidade: z.enum(["mensal", "anual"]),
            precoUnitario: z.number(),
            receitaMensal: z.number(),
            escopo: texto,
          }),
        )
        .min(1)
        .max(6),
      faturamentoMensal: z.number(),
      custos: z.array(z.object({ descricao: texto, valor: z.number() })).min(1).max(8),
      totalCustos: z.number(),
      remuneracaoDono: z.number(),
      resultado: z.number(),
      notaTributos: z.string(),
      notaInterpretacao: z.string(),
      destinacao: z.string(),
    }),
  }),
});

export type ConteudoIdeia = z.infer<typeof conteudoSchema>;

// Lê o JSON do banco com segurança: conteúdo inválido vira null (a página trata
// como "indisponível") em vez de quebrar a tela.
export function lerConteudo(valor: unknown): ConteudoIdeia | null {
  const r = conteudoSchema.safeParse(valor);
  return r.success ? r.data : null;
}

// --- O negócio como veio do arquivo (só o que usamos) ------------------------

export const fonteOriginalSchema = z.object({
  id: texto,
  titulo: texto,
  autor: z.string().optional(),
  url: z.string().optional(),
  tipo: z.string().optional(),
  periodo: z.string().optional(),
  alcance_e_limite: z.string().optional(),
});
export type FonteOriginal = z.infer<typeof fonteOriginalSchema>;

export const negocioOriginalSchema = z
  .object({
    id: texto,
    slug: texto,
    categoria_id: texto,
    ordem_geral: z.number(),
    nome: texto,
    resumo: texto,
    o_que_empresa_faz: z.object({
      descricao: texto,
      exemplo_pratico: texto,
      foco_lucratividade_proposto: texto,
    }),
    por_que_merece_atencao: z.object({ paragrafos: z.array(texto).min(1) }),
    primeiro_servico_para_colocar_no_mercado: z.object({
      oferta_inicial: texto,
      plano_inicial: texto,
      observacao_de_escopo: z.string().nullable().optional(),
    }),
    cenario_cinco_anos: z.object({
      marcos_crescimento: z.array(z.object({ etapa: texto, descricao: texto })).min(1),
      estrutura_operacao: texto,
      dedicacao_proprietario_horas_semana: z.object({ minimo: z.number(), maximo: z.number() }),
      capacidade_e_premissas_operacionais: texto,
      simulacao_financeira: z.object({
        receitas: z
          .array(
            z.object({
              descricao: texto,
              quantidade_no_periodo: z.number(),
              periodicidade_origem: z.enum(["mensal", "anual"]),
              preco_unitario_brl: z.number(),
              receita_mensal_equivalente_brl: z.number(),
              escopo: texto,
            }),
          )
          .min(1),
        faturamento_bruto_mensal_brl: z.number(),
        custos_e_remuneracao: z.array(z.object({ descricao: texto, valor_mensal_brl: z.number() })).min(1),
        total_custos_e_remuneracao_mensal_brl: z.number(),
        remuneracao_proprietario_bruta_mensal_brl: z.number(),
        resultado_empresa_apos_remuneracao_mensal_brl: z.number(),
        destinacao_resultado_no_modelo: z.string(),
        nota_tributos: z.string(),
        nota_interpretacao: z.string(),
      }),
    }),
    fontes_ids: z.array(texto),
  })
  .passthrough();

export type NegocioOriginal = z.infer<typeof negocioOriginalSchema>;

// Conversão determinística (sem IA) do arquivo para o conteúdo que o professor lê.
export function conteudoDoOriginal(n: NegocioOriginal): ConteudoIdeia {
  const e = n.o_que_empresa_faz;
  const s = n.primeiro_servico_para_colocar_no_mercado;
  const c = n.cenario_cinco_anos;
  const f = c.simulacao_financeira;
  return {
    versao: CONTEUDO_VERSAO,
    nome: n.nome,
    resumo: n.resumo,
    empresaFaz: {
      descricao: e.descricao,
      exemplo: e.exemplo_pratico,
      focoLucratividade: e.foco_lucratividade_proposto,
    },
    porqueAtencao: n.por_que_merece_atencao.paragrafos,
    primeiroServico: {
      oferta: s.oferta_inicial,
      plano: s.plano_inicial,
      observacaoEscopo: s.observacao_de_escopo?.trim() ? s.observacao_de_escopo : null,
    },
    cincoAnos: {
      marcos: c.marcos_crescimento,
      estrutura: c.estrutura_operacao,
      horasSemana: c.dedicacao_proprietario_horas_semana,
      premissas: c.capacidade_e_premissas_operacionais,
      simulacao: {
        receitas: f.receitas.map((r) => ({
          descricao: r.descricao,
          quantidade: r.quantidade_no_periodo,
          periodicidade: r.periodicidade_origem,
          precoUnitario: r.preco_unitario_brl,
          receitaMensal: r.receita_mensal_equivalente_brl,
          escopo: r.escopo,
        })),
        faturamentoMensal: f.faturamento_bruto_mensal_brl,
        custos: f.custos_e_remuneracao.map((x) => ({ descricao: x.descricao, valor: x.valor_mensal_brl })),
        totalCustos: f.total_custos_e_remuneracao_mensal_brl,
        remuneracaoDono: f.remuneracao_proprietario_bruta_mensal_brl,
        resultado: f.resultado_empresa_apos_remuneracao_mensal_brl,
        notaTributos: f.nota_tributos,
        notaInterpretacao: f.nota_interpretacao,
        destinacao: f.destinacao_resultado_no_modelo,
      },
    },
  };
}

// --- Textos reescritos pela IA ------------------------------------------------
// A IA devolve SÓ texto. Números, nome, horas e a estrutura da simulação ficam
// como estão na base (aplicarTextos mescla), para ela nunca mexer em valor.

export type TextosIdeia = {
  resumo: string;
  empresaFaz: { descricao: string; exemplo: string; focoLucratividade: string };
  porqueAtencao: string[];
  primeiroServico: { oferta: string; plano: string; observacaoEscopo: string | null };
  cincoAnos: { marcos: string[]; estrutura: string; premissas: string };
};

export function textosDoConteudo(c: ConteudoIdeia): TextosIdeia {
  return {
    resumo: c.resumo,
    empresaFaz: c.empresaFaz,
    porqueAtencao: c.porqueAtencao,
    primeiroServico: c.primeiroServico,
    cincoAnos: { marcos: c.cincoAnos.marcos.map((m) => m.descricao), estrutura: c.cincoAnos.estrutura, premissas: c.cincoAnos.premissas },
  };
}

export function aplicarTextos(base: ConteudoIdeia, t: TextosIdeia): ConteudoIdeia {
  return {
    ...base,
    resumo: t.resumo,
    empresaFaz: t.empresaFaz,
    porqueAtencao: t.porqueAtencao.length > 0 ? t.porqueAtencao.slice(0, 4) : base.porqueAtencao,
    primeiroServico: t.primeiroServico,
    cincoAnos: {
      ...base.cincoAnos,
      // As etapas (nomes dos marcos) e o número de marcos vêm da base; só a descrição é da IA.
      marcos: base.cincoAnos.marcos.map((m, i) => ({ etapa: m.etapa, descricao: t.cincoAnos.marcos[i] ?? m.descricao })),
      estrutura: t.cincoAnos.estrutura,
      premissas: t.cincoAnos.premissas,
    },
  };
}

// --- Formatação ---------------------------------------------------------------

export function reais(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function faixaHoras(h: { minimo: number; maximo: number }): string {
  return h.minimo === h.maximo ? `${h.minimo} h por semana` : `${h.minimo} a ${h.maximo} h por semana`;
}
