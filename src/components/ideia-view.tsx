import type { ReactNode } from "react";
import { faixaHoras, reais, type ConteudoIdeia } from "@/lib/ideias/conteudo";
import { AlvoIcon, BandeiraIcon, CrescerIcon, EmpresaIcon, LampadaIcon, RelogioIcon } from "./ficha-icons";

const sectionClass = "rounded-[var(--radius-app)] border border-line bg-paper-raised p-5";
const titleClass = "font-serif text-[17px] font-medium tracking-tight text-petrol";
const textClass = "text-[14.5px] leading-[1.6] text-ink";
const labelClass = "mb-1 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase";

function Bloco({ titulo, icone, children }: { titulo: string; icone: ReactNode; children: ReactNode }) {
  return (
    <section className={sectionClass}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold">
          {icone}
        </span>
        <h2 className={titleClass}>{titulo}</h2>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <p className={labelClass}>{rotulo}</p>
      {children}
    </div>
  );
}

// As ideias de negócio como o professor lê: 5 cards, na ordem do arquivo importado.
// O mesmo componente serve à página do professor e à revisão do admin; `acao` é um
// espaço no card 1 (ex.: o coração de favoritar).
export function IdeiaView({
  conteudo,
  categoria,
  acao,
}: {
  conteudo: ConteudoIdeia;
  categoria: string;
  acao?: ReactNode;
}) {
  const { empresaFaz, primeiroServico, cincoAnos } = conteudo;
  const sim = cincoAnos.simulacao;

  return (
    <div className="flex flex-col gap-3.5">
      {/* 1. Nome e resumo */}
      <section className={sectionClass}>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold">
            <LampadaIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="mb-1 font-mono text-[10.5px] tracking-wide text-ink-muted uppercase">{categoria}</p>
            <h1 className="font-serif text-[clamp(24px,5vw,32px)] leading-[1.15] font-medium tracking-tight text-petrol">
              {conteudo.nome}
            </h1>
            <p className="mt-2 text-[16.5px] leading-[1.55] text-ink">{conteudo.resumo}</p>
          </div>
          {acao ? <div className="shrink-0">{acao}</div> : null}
        </div>
      </section>

      {/* 2. O que essa empresa faz */}
      <Bloco titulo="O que essa empresa faz" icone={<EmpresaIcon />}>
        <p className={textClass}>{empresaFaz.descricao}</p>
        <Campo rotulo="Exemplo prático">
          <p className={textClass}>{empresaFaz.exemplo}</p>
          <p className="mt-1 text-[12.5px] text-ink-muted">Situação ilustrativa, não é um caso real.</p>
        </Campo>
        <Campo rotulo="Foco de lucratividade">
          <p className={textClass}>{empresaFaz.focoLucratividade}</p>
        </Campo>
      </Bloco>

      {/* 3. Por que esse negócio merece atenção */}
      <Bloco titulo="Por que esse negócio merece atenção" icone={<AlvoIcon />}>
        {conteudo.porqueAtencao.map((p, i) => (
          <p key={i} className={textClass}>
            {p}
          </p>
        ))}
      </Bloco>

      {/* 4. Primeiro serviço para colocar no mercado */}
      <Bloco titulo="Primeiro serviço para colocar no mercado" icone={<BandeiraIcon />}>
        <div className="rounded-lg bg-gold-soft px-4 py-3">
          <p className={labelClass}>Oferta inicial</p>
          <p className="text-[15px] leading-[1.55] font-medium text-petrol">{primeiroServico.oferta}</p>
        </div>
        <p className={textClass}>{primeiroServico.plano}</p>
        {primeiroServico.observacaoEscopo ? (
          <Campo rotulo="Escopo a observar">
            <p className={textClass}>{primeiroServico.observacaoEscopo}</p>
          </Campo>
        ) : null}
      </Bloco>

      {/* 5. Onde esse negócio pode chegar em cinco anos */}
      <Bloco titulo="Onde esse negócio pode chegar em cinco anos" icone={<CrescerIcon />}>
        <ol className="ml-2 flex flex-col gap-4 border-l-2 border-gold-soft pl-5">
          {cincoAnos.marcos.map((m, i) => {
            const ultimo = i === cincoAnos.marcos.length - 1;
            return (
              <li key={m.etapa} className="relative">
                <span
                  className={`absolute top-1 rounded-full bg-gold ${
                    ultimo ? "-left-[29px] h-3.5 w-3.5 ring-4 ring-gold-soft" : "-left-[27px] h-2.5 w-2.5"
                  }`}
                  aria-hidden
                />
                <p className="mb-0.5 font-mono text-[11px] font-semibold tracking-[0.05em] text-gold uppercase">
                  {m.etapa}
                </p>
                <p className={textClass}>{m.descricao}</p>
              </li>
            );
          })}
        </ol>

        <p className={textClass}>{cincoAnos.estrutura}</p>
        <p className="inline-flex items-center gap-2 text-[14px] font-medium text-petrol">
          <span className="text-gold">
            <RelogioIcon className="h-4 w-4" />
          </span>
          Dedicação estimada do proprietário: {faixaHoras(cincoAnos.horasSemana)}
        </p>
        <p className="text-[13.5px] leading-[1.55] text-ink-muted">{cincoAnos.premissas}</p>

        <div className="mt-1 border-t border-line pt-4">
          <p className="mb-1 font-serif text-[16px] font-medium text-petrol">
            Uma hipótese de operação consolidada, na média mensal do ano
          </p>
          <p className="mb-3 rounded-lg bg-gold-soft px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-ink">
            Simulação ilustrativa, em reais de 2026. Preços, quantidades e custos são hipóteses de planejamento,
            não renda média observada nem garantia.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-[14px] tabular-nums">
              <tbody>
                {sim.receitas.map((r) => (
                  <tr key={r.descricao} className="align-top">
                    <td className="py-1.5 pr-3 text-ink">
                      {r.descricao}
                      <span className="block text-[12.5px] text-ink-muted">
                        {r.quantidade.toLocaleString("pt-BR")} por {r.periodicidade === "anual" ? "ano" : "mês"} ×{" "}
                        {reais(r.precoUnitario)}
                      </span>
                    </td>
                    <td className="py-1.5 text-right whitespace-nowrap text-ink">{reais(r.receitaMensal)}</td>
                  </tr>
                ))}
                <tr className="border-t border-line font-semibold text-petrol">
                  <td className="py-2 pr-3">Faturamento bruto</td>
                  <td className="py-2 text-right whitespace-nowrap">{reais(sim.faturamentoMensal)}</td>
                </tr>
                {sim.custos.map((c) => (
                  <tr key={c.descricao}>
                    <td className="py-1.5 pr-3 text-ink-muted">− {c.descricao}</td>
                    <td className="py-1.5 text-right whitespace-nowrap text-ink-muted">− {reais(c.valor)}</td>
                  </tr>
                ))}
                <tr className="border-t border-line bg-gold-soft font-semibold text-petrol">
                  <td className="px-2 py-2 pr-3">Resultado estimado após essa remuneração</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">{reais(sim.resultado)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className={`${textClass} mt-3`}>
            Nessa hipótese, o professor recebe <strong>{reais(sim.remuneracaoDono)} brutos por mês</strong> pelo
            trabalho, e a empresa tem <strong>{reais(sim.resultado)} de resultado</strong> após essa remuneração.{" "}
            {sim.destinacao}
          </p>

          <div className="mt-3">
            <p className={labelClass}>Escopo dos serviços considerados</p>
            <ul className="flex list-disc flex-col gap-1 pl-5 marker:text-gold">
              {sim.receitas.map((r) => (
                <li key={r.descricao} className="text-[13.5px] leading-[1.5] text-ink-muted">
                  <span className="font-medium text-ink">{r.descricao}:</span> {r.escopo}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 text-[12px] leading-[1.5] text-ink-muted">
            {sim.notaInterpretacao} {sim.notaTributos}
          </p>
        </div>
      </Bloco>
    </div>
  );
}
