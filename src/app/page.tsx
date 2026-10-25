import { AppHeader } from "@/components/app-header";
import { PapelIcon } from "@/components/papel-icon";
import { ProgressoPlano, SeloStatusAcao } from "@/components/progresso-plano";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { SHARED_STEPS, getResumeSlug } from "@/lib/diagnostico/steps";
import { resumoDasAcoes } from "@/lib/plano/acoes";
import { cotaDePlanos } from "@/lib/planos/cota";
import { LogoutButton } from "./logout-button";

export default async function Home() {
  const user = await requireActiveAccess({ gratuitoVaiPara: "/negocios" });

  const [diagnostic, activePlan, dbUser, totalPlanos] = await Promise.all([
    db.diagnostic.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.plan.findFirst({
      where: { userId: user.id, status: "ATIVO" },
      include: { possibility: true, acoes: { orderBy: { sequencia: "asc" }, include: { itens: { select: { feito: true } } } } },
    }),
    db.user.findUnique({ where: { id: user.id }, select: { isAdmin: true, name: true } }),
    db.plan.count({ where: { userId: user.id } }),
  ]);
  const cota = cotaDePlanos(totalPlanos);

  const diagnosticCta = !diagnostic
    ? { label: "Começar diagnóstico", href: `/diagnostico/${SHARED_STEPS[0].slug}` }
    : diagnostic.status === "EM_ANDAMENTO"
      ? {
          label: "Continuar diagnóstico",
          href: `/diagnostico/${getResumeSlug(diagnostic.intention, diagnostic.rotaProfissional, diagnostic.answers as Record<string, unknown>)}`,
        }
      : { label: "Ver meus negócios", href: "/diagnostico/concluido" };

  const acoes = activePlan?.acoes ?? [];
  const planoNovo = acoes.length > 0 && acoes.some((a) => a.itens.length > 0);
  const resumo = resumoDasAcoes(acoes);
  const proxima = resumo.proxima !== null ? acoes.find((a) => a.sequencia === resumo.proxima) : undefined;

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PAINEL" />

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
            {diagnostic ? "De volta" : "Bem-vindo(a) à Renda Além da Sala"}
          </span>
          <h1 className="mb-3.5 font-serif text-[clamp(28px,5vw,38px)] leading-[1.15] font-medium tracking-tight text-petrol">
            Olá, {dbUser?.name ?? user.email}.
          </h1>
        </div>
        <LogoutButton />
      </div>

      {activePlan && planoNovo ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <PapelIcon papel={activePlan.possibility.papel} className="h-[15px] w-[15px] shrink-0 text-petrol" />
            <span className="font-mono text-[10px] tracking-wide text-ink-muted uppercase">Plano ativo</span>
            <a href={`/planos/${activePlan.id}`} className="text-[13px] font-semibold text-petrol hover:underline">
              {activePlan.possibility.titulo} →
            </a>
          </div>

          {/* Evolução: o progresso do plano ativo, num lugar só (era uma página à parte). */}
          <section className="mb-5 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
            <ProgressoPlano acoes={acoes} />
          </section>

          {proxima ? (
            <section className="mb-5 rounded-[var(--radius-app)] border border-gold bg-gold-soft p-5">
              <p className="mb-1 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">
                {proxima.status === "EM_ANDAMENTO" ? "Continue de onde parou" : "Sua próxima ação"}
              </p>
              <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                <h2 className="font-serif text-[20px] font-medium tracking-tight text-ink">
                  {proxima.sequencia}. {proxima.nome}
                </h2>
                <SeloStatusAcao status={proxima.status} />
              </div>
              <p className="mb-3 text-[14px] leading-[1.55] text-ink-muted">{proxima.objetivo}</p>
              <a
                href={`/planos/${activePlan.id}/acoes/${proxima.id}`}
                className="inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
              >
                {proxima.status === "EM_ANDAMENTO" ? "Continuar esta ação →" : "Começar esta ação →"}
              </a>
            </section>
          ) : (
            <section className="mb-5 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
              <p className="mb-1 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">Plano concluído</p>
              <p className="text-[14.5px] leading-[1.55] text-ink">
                Você concluiu todas as ações deste plano. Veja o resultado, avalie o que aprendeu e decida o próximo
                passo.
              </p>
            </section>
          )}

          <p className="text-[13px] text-ink-muted">
            <a href={`/planos/${activePlan.id}`} className="font-semibold text-petrol hover:underline">
              Ver todas as ações
            </a>{" "}
            ·{" "}
            <a href="/planos" className="font-semibold text-petrol hover:underline">
              Planos de execução ({cota.usados} de {cota.limite})
            </a>
          </p>
        </>
      ) : activePlan ? (
        <div className="mb-8 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
          <span className="mb-1 block font-mono text-[10px] tracking-wide text-gold uppercase">Plano no formato antigo</span>
          <p className="mb-2 font-serif text-lg font-medium text-ink">{activePlan.possibility.titulo}</p>
          <p className="text-[13.5px] text-ink-muted">
            Este plano foi criado no formato por semanas, que foi substituído pelo plano de ações com checklist.
          </p>
          <a href="/planos" className="mt-3 inline-block text-[13px] font-semibold text-petrol hover:underline">
            Ir para Planos de execução →
          </a>
        </div>
      ) : (
        <a
          href={diagnosticCta.href}
          className="mb-4 inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
        >
          {diagnosticCta.label} →
        </a>
      )}
    </div>
  );
}
