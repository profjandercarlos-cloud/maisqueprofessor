import { AppHeader } from "@/components/app-header";
import { PapelIcon } from "@/components/papel-icon";
import { ProgressoPlano, SeloStatusAcao } from "@/components/progresso-plano";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { SHARED_STEPS, getResumeSlug } from "@/lib/diagnostico/steps";
import { resumoDasAcoes } from "@/lib/plano/acoes";
import { estadosDaJornada, type EstadoDoPasso } from "@/lib/plano/jornada";
import { formatDate } from "@/lib/format-date";
import { cotaDePlanos } from "@/lib/planos/cota";
import { LogoutButton } from "./logout-button";

export default async function Home() {
  const user = await requireActiveAccess({ gratuitoVaiPara: "/negocios" });

  const [diagnostic, activePlan, dbUser, planos, favoritos, rodada] = await Promise.all([
    db.diagnostic.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.plan.findFirst({
      where: { userId: user.id, status: "ATIVO" },
      include: { possibility: true, acoes: { orderBy: { sequencia: "asc" }, include: { itens: { select: { feito: true } } } } },
    }),
    db.user.findUnique({ where: { id: user.id }, select: { isAdmin: true, name: true } }),
    db.plan.findMany({
      where: { userId: user.id },
      select: { status: true, acoes: { select: { status: true } } },
    }),
    db.ideiaFavorita.count({ where: { userId: user.id, ideia: { status: "APROVADO" } } }),
    db.generationRound.findFirst({
      where: { diagnostic: { userId: user.id }, status: "CONCLUIDO" },
      orderBy: { createdAt: "desc" },
      include: { possibilities: { include: { plan: { select: { acoes: { select: { status: true } } } } } } },
    }),
  ]);
  const totalPlanos = planos.length;
  const cota = cotaDePlanos(totalPlanos);

  // Seu caminho: o "você está aqui" que o antigo Mapa dava.
  const negocios = rodada?.possibilities ?? [];
  const negociosComPlano = negocios.filter((n) => n.plan).length;
  const diagnosticoConcluido = diagnostic?.status === "CONCLUIDO";
  const estados = estadosDaJornada({
    diagnosticoConcluido,
    negociosGerados: negocios.length,
    favoritos,
    planos: totalPlanos,
  });
  const planosEmExecucao = planos.filter(
    (pl) => pl.acoes.length > 0 && pl.acoes.some((a) => a.status !== "A_FAZER") && !pl.acoes.every((a) => a.status === "CONCLUIDA"),
  ).length;
  const planosConcluidos = planos.filter((pl) => pl.acoes.length > 0 && pl.acoes.every((a) => a.status === "CONCLUIDA")).length;

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
        <section className="mb-5 rounded-[var(--radius-app)] border border-gold bg-gold-soft p-5">
          <p className="mb-1 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">
            {totalPlanos > 0 ? "Nenhum plano ativo" : "Seu próximo passo"}
          </p>
          <p className="mb-3 text-[14.5px] leading-[1.55] text-ink">
            {totalPlanos > 0
              ? "Você tem planos criados, mas nenhum está ativo agora. Escolha um para continuar de onde parou."
              : estados.planos === "atual"
                ? "Você já tem negócios para escolher. Crie o plano de execução de um deles."
                : "Responda o diagnóstico para receber negócios personalizados, ou explore as ideias de negócios e favorite as que combinam com você."}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href={totalPlanos > 0 || estados.planos === "atual" ? "/planos" : diagnosticCta.href}
              className="inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
            >
              {totalPlanos > 0
                ? "Ver meus planos"
                : estados.planos === "atual"
                  ? "Criar meu primeiro plano"
                  : diagnosticCta.label}{" "}
              →
            </a>
            {totalPlanos === 0 && estados.planos !== "atual" ? (
              <a href="/negocios" className="text-[13px] font-semibold text-petrol hover:underline">
                Explorar ideias de negócios
              </a>
            ) : null}
          </div>
        </section>
      )}

      {/* Seu caminho: o antigo Mapa, em três passos. Diagnóstico e favoritos são duas portas para os mesmos planos. */}
      <section className="mt-9" aria-label="Seu caminho">
        <h2 className="mb-4 font-mono text-[11px] tracking-[0.08em] text-gold uppercase">Seu caminho</h2>
        <ol className="flex flex-col">
          <PassoDoCaminho
            numero={1}
            estado={estados.diagnostico}
            titulo="Diagnóstico"
            ultimo={false}
            resumo={
              diagnosticoConcluido
                ? `Concluído em ${formatDate(diagnostic!.updatedAt, { day: "2-digit", month: "long", year: "numeric" })}`
                : diagnostic
                  ? "Em andamento"
                  : "Ainda não iniciado"
            }
            links={
              diagnosticoConcluido
                ? [{ href: "/diagnostico/respostas", texto: "Ver minhas respostas" }]
                : [{ href: diagnosticCta.href, texto: diagnostic ? "Continuar diagnóstico" : "Começar diagnóstico" }]
            }
          />
          <PassoDoCaminho
            numero={2}
            estado={estados.negocios}
            titulo="Negócios"
            ultimo={false}
            resumo={
              negocios.length > 0
                ? `Gerados para você: ${negocios.length}${negociosComPlano > 0 ? ` · ${negociosComPlano} com plano` : ""}`
                : diagnosticoConcluido
                  ? "Seus negócios personalizados ainda não foram gerados"
                  : "Os negócios personalizados aparecem depois do diagnóstico"
            }
            segundoResumo={`Ideias favoritas: ${favoritos}`}
            links={[
              ...(negocios.length > 0 || diagnosticoConcluido ? [{ href: "/diagnostico/concluido", texto: "Meus negócios" }] : []),
              favoritos > 0
                ? { href: "/negocios/favoritos", texto: "Meus favoritos" }
                : { href: "/negocios", texto: "Explorar ideias de negócios" },
            ]}
          />
          <PassoDoCaminho
            numero={3}
            estado={estados.planos}
            titulo="Planos de execução"
            ultimo
            resumo={`${cota.usados} de ${cota.limite} planos usados`}
            segundoResumo={
              planosEmExecucao + planosConcluidos > 0
                ? [
                    planosEmExecucao > 0 ? `${planosEmExecucao} em execução` : null,
                    planosConcluidos > 0 ? `${planosConcluidos} ${planosConcluidos === 1 ? "concluído" : "concluídos"}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : undefined
            }
            links={[{ href: "/planos", texto: "Ver planos de execução" }]}
          />
        </ol>
      </section>
    </div>
  );
}

const MARCADOR: Record<EstadoDoPasso, { fundo: string; borda: string; cor: string }> = {
  feito: { fundo: "var(--petrol)", borda: "var(--petrol)", cor: "var(--paper)" },
  atual: { fundo: "var(--gold-soft)", borda: "var(--gold)", cor: "var(--petrol)" },
  pendente: { fundo: "transparent", borda: "var(--line)", cor: "var(--ink-muted)" },
};

function PassoDoCaminho({
  numero,
  estado,
  titulo,
  resumo,
  segundoResumo,
  links,
  ultimo,
}: {
  numero: number;
  estado: EstadoDoPasso;
  titulo: string;
  resumo: string;
  segundoResumo?: string;
  links: { href: string; texto: string }[];
  ultimo: boolean;
}) {
  const m = MARCADOR[estado];
  return (
    <li className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[11px] font-semibold"
          style={{ background: m.fundo, borderColor: m.borda, color: m.cor }}
        >
          {estado === "feito" ? "✓" : numero}
        </span>
        {!ultimo ? <span className="my-1 w-px flex-1 bg-line" aria-hidden /> : null}
      </div>
      <div className={`min-w-0 flex-1 ${ultimo ? "" : "pb-6"}`}>
        <p className="flex flex-wrap items-center gap-2 font-serif text-[16px] font-medium text-ink">
          {titulo}
          {estado === "atual" ? (
            <span className="rounded-full bg-gold px-2 py-[1px] font-mono text-[9px] font-semibold tracking-[0.06em] text-paper uppercase">
              Você está aqui
            </span>
          ) : null}
        </p>
        <p className="text-[13.5px] text-ink-muted">{resumo}</p>
        {segundoResumo ? <p className="text-[13.5px] text-ink-muted">{segundoResumo}</p> : null}
        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-[13px] font-semibold text-petrol hover:underline">
              {l.texto} →
            </a>
          ))}
        </p>
      </div>
    </li>
  );
}
