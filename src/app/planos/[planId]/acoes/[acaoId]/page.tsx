import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ChecklistAcao } from "@/components/checklist-acao";
import { AlvoIcon, EscudoIcon, LivroIcon } from "@/components/ficha-icons";
import { SeloStatusAcao } from "@/components/progresso-plano";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { lerOrientacoes } from "@/lib/plano/acoes";
import type { ReactNode } from "react";

function Bloco({ titulo, icone, itens }: { titulo: string; icone: ReactNode; itens: string[] }) {
  if (itens.length === 0) return null;
  return (
    <section className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold">
          {icone}
        </span>
        <h2 className="font-serif text-[17px] font-medium tracking-tight text-petrol">{titulo}</h2>
      </div>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-gold">
        {itens.map((t, i) => (
          <li key={i} className="text-[14.5px] leading-[1.6] text-ink">
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function AcaoPage({ params }: { params: Promise<{ planId: string; acaoId: string }> }) {
  const { planId, acaoId } = await params;
  const user = await requireActiveAccess();

  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      possibility: { select: { titulo: true } },
      acoes: { orderBy: { sequencia: "asc" }, select: { id: true, sequencia: true, nome: true } },
    },
  });
  if (!plan || plan.userId !== user.id) notFound();

  const acao = await db.planAcao.findFirst({
    where: { id: acaoId, planId },
    include: { itens: { orderBy: { sequencia: "asc" } } },
  });
  if (!acao) notFound();

  const orientacoes = lerOrientacoes(acao.orientacoes);
  const indice = plan.acoes.findIndex((a) => a.id === acao.id);
  const anterior = indice > 0 ? plan.acoes[indice - 1] : null;
  const proxima = indice >= 0 && indice < plan.acoes.length - 1 ? plan.acoes[indice + 1] : null;

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PLANO DE EXECUÇÃO" />

      <a href={`/planos/${plan.id}`} className="mb-4 inline-block text-[13px] font-semibold text-petrol hover:underline">
        ← {plan.possibility.titulo}
      </a>

      <div className="mb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase">
            Ação {acao.sequencia} de {plan.acoes.length}
          </span>
          <SeloStatusAcao status={acao.status} />
        </div>
        <h1 className="mb-2 font-serif text-[clamp(25px,5vw,32px)] leading-[1.15] font-medium tracking-tight text-petrol">
          {acao.nome}
        </h1>
        <p className="text-[15.5px] leading-[1.55] text-ink">{acao.objetivo}</p>
      </div>

      <div className="flex flex-col gap-3.5">
        <section className="rounded-[var(--radius-app)] border border-gold bg-gold-soft p-5">
          <p className="mb-1 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">Pronto quando</p>
          <p className="text-[14.5px] leading-[1.6] text-ink">{acao.escopoMinimo}</p>
        </section>

        <section className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
          <h2 className="mb-3 font-serif text-[17px] font-medium tracking-tight text-petrol">Seu checklist</h2>
          {acao.itens.length > 0 ? (
            <ChecklistAcao
              planId={plan.id}
              acaoId={acao.id}
              itens={acao.itens.map((i) => ({ id: i.id, texto: i.texto, feito: i.feito }))}
            />
          ) : (
            <p className="text-[14px] text-ink-muted">Esta ação não tem checklist (plano no formato antigo).</p>
          )}
        </section>

        {orientacoes ? (
          <>
            <Bloco titulo="Como fazer" icone={<LivroIcon />} itens={orientacoes.comoFazer} />
            <Bloco titulo="Pontos de atenção" icone={<AlvoIcon />} itens={orientacoes.pontosDeAtencao} />
            <Bloco titulo="Erros comuns" icone={<EscudoIcon />} itens={orientacoes.errosComuns} />
          </>
        ) : null}
      </div>

      <nav className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        {anterior ? (
          <a
            href={`/planos/${plan.id}/acoes/${anterior.id}`}
            className="text-[13.5px] font-semibold text-petrol hover:underline"
          >
            ← Ação {anterior.sequencia}: {anterior.nome}
          </a>
        ) : (
          <span />
        )}
        {proxima ? (
          <a
            href={`/planos/${plan.id}/acoes/${proxima.id}`}
            className="text-[13.5px] font-semibold text-petrol hover:underline"
          >
            Ação {proxima.sequencia}: {proxima.nome} →
          </a>
        ) : (
          <a href={`/planos/${plan.id}`} className="text-[13.5px] font-semibold text-petrol hover:underline">
            Ver o plano completo →
          </a>
        )}
      </nav>
    </div>
  );
}
