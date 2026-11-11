import { cookies } from "next/headers";
import { AppHeader } from "@/components/app-header";
import { ChamadaDoDia } from "@/components/chamada-do-dia";
import { PresencaMarcada } from "@/components/presenca-marcada";
import { SubmitButton } from "@/components/submit-button";
import { marcarPresencaAction } from "@/app/lista-de-presenca/actions";
import { lerMes } from "@/lib/presenca/calendario";
import { COOKIE_ADIOU_PRESENCA, contextoDaPessoa } from "@/lib/presenca/contexto";
import { diaLocal } from "@/lib/presenca/dias";
import { diasDePresenca, estadoDeHoje } from "@/lib/presenca/servico";
import { PapelIcon } from "@/components/papel-icon";
import { ListaDeAcoes } from "@/components/lista-de-acoes";
import { MapaDaJornada } from "@/components/mapa-da-jornada";
import { MedalhasDoPlano } from "@/components/medalhas-do-plano";
import { ProgressoPlano, SeloStatusAcao } from "@/components/progresso-plano";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { SHARED_STEPS, getResumeSlug } from "@/lib/diagnostico/steps";
import { resumoDasAcoes } from "@/lib/plano/acoes";
import { estadosDaJornada } from "@/lib/plano/jornada";
import { cotaDePlanos } from "@/lib/planos/cota";
import { LogoutButton } from "./logout-button";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireActiveAccess({ gratuitoVaiPara: "/negocios" });
  const query = await searchParams;

  // Lista de presença: na primeira abertura do dia, a pessoa passa pela chamada. O dia só conta
  // quando ela responde "Presente"; "Só passei por aqui" entra no app sem contar.
  const hoje = diaLocal(new Date());
  const dias = await diasDePresenca(user.id);
  const presenteHoje = dias.includes(hoje);
  const adiouHoje = (await cookies()).get(COOKIE_ADIOU_PRESENCA)?.value === hoje;

  if (!presenteHoje && !adiouHoje) {
    const contexto = await contextoDaPessoa(user.id);
    return (
      <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
        <AppHeader progressLabel="LISTA DE PRESENÇA" />
        <ChamadaDoDia
          contexto={contexto}
          total={dias.length}
          presentes={new Set(dias)}
          hoje={hoje}
          mes={lerMes(typeof query.mes === "string" ? query.mes : undefined, hoje)}
        />
      </div>
    );
  }

  if (presenteHoje && query.presente === "1") {
    const contexto = await contextoDaPessoa(user.id);
    const estado = await estadoDeHoje(user.id, { nome: contexto.nome, proximaAcao: contexto.proximaAcao });
    return (
      <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
        <AppHeader progressLabel="LISTA DE PRESENÇA" />
        <PresencaMarcada estado={estado} nome={contexto.nome} />
      </div>
    );
  }

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
  const planosConcluidos = planos.filter((pl) => pl.acoes.length > 0 && pl.acoes.every((a) => a.status === "CONCLUIDA")).length;
  const estados = estadosDaJornada({
    diagnosticoConcluido,
    negociosGerados: negocios.length,
    favoritos,
    planos: totalPlanos,
    planosConcluidos,
  });

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

      {!presenteHoje ? (
        <form
          action={marcarPresencaAction}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-app)] border border-line bg-paper-raised px-4 py-3"
        >
          <p className="text-[13.5px] text-ink-muted">Hoje você ainda não marcou presença.</p>
          <SubmitButton
            pendingText="Registrando..."
            className="rounded-lg border border-petrol px-4 py-1.5 text-[13px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
          >
            Marcar presença de hoje
          </SubmitButton>
        </form>
      ) : null}

      {activePlan && planoNovo ? (
        <>
          {/* Evolução: o progresso do plano ativo, num lugar só (era uma página à parte).
              O nome do plano é o cabeçalho do card, para ficar claro de qual plano é o progresso. */}
          <section className="mb-5 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
            <a
              href={`/planos/${activePlan.id}`}
              className="group mb-4 flex items-center gap-3 border-b border-line pb-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft">
                <PapelIcon papel={activePlan.possibility.papel} className="h-[20px] w-[20px] text-petrol" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">Plano ativo</span>
                <span className="block font-serif text-[20px] leading-tight font-medium tracking-tight text-petrol group-hover:underline">
                  {activePlan.possibility.titulo}
                </span>
              </span>
              <span className="shrink-0 text-[13px] font-semibold text-petrol">Abrir →</span>
            </a>
            <ProgressoPlano acoes={acoes} />
            {acoes.some((a) => a.marco) ? (
              <div className="mt-5 border-t border-line pt-4">
                <MedalhasDoPlano acoes={acoes} />
              </div>
            ) : null}
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

          {/* Visão geral: todas as ações do plano, com o estado de cada uma e a de agora em destaque. */}
          <section className="mb-5 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-[18px] font-medium tracking-tight text-petrol">Todas as ações do plano</h2>
              <a href={`/planos/${activePlan.id}`} className="text-[13px] font-semibold text-petrol hover:underline">
                Abrir o plano completo →
              </a>
            </div>
            <ListaDeAcoes planId={activePlan.id} acoes={acoes} atual={resumo.proxima} resumida />
          </section>

          <p className="text-[13px] text-ink-muted">
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

      {/* Seu caminho: o antigo Mapa. Uma trilha com as quatro paradas e o "Você está aqui". */}
      <section className="mt-9" aria-label="Seu caminho">
        <h2 className="mb-5 font-mono text-[11px] tracking-[0.08em] text-gold uppercase">Seu caminho</h2>
        <MapaDaJornada
          estados={estados}
          destinos={{
            diagnostico: diagnosticoConcluido ? "/diagnostico/respostas" : diagnosticCta.href,
            negocios: negocios.length > 0 ? "/diagnostico/concluido" : favoritos > 0 ? "/negocios/favoritos" : "/negocios",
            planos: "/planos",
            execucao: activePlan && planoNovo ? `/planos/${activePlan.id}` : "/planos",
          }}
          resumos={{
            diagnostico: [diagnosticoConcluido ? "Concluído" : diagnostic ? "Em andamento" : "Não iniciado"],
            negocios:
              negocios.length + favoritos > 0
                ? [
                    ...(negocios.length > 0 ? [`${negocios.length} personalizados`] : []),
                    ...(favoritos > 0 ? [`${favoritos} ${favoritos === 1 ? "favorito" : "favoritos"}`] : []),
                  ]
                : ["Nenhum ainda"],
            planos: [`${cota.usados} de ${cota.limite} criados`],
            execucao:
              activePlan && planoNovo
                ? [`${resumo.concluidas} de ${resumo.total} ações`]
                : totalPlanos > 0 && planosConcluidos === totalPlanos
                  ? ["Concluída"]
                  : ["Ainda não começou"],
          }}
          proximo={
            estados.diagnostico === "atual"
              ? {
                  texto:
                    "Responda o diagnóstico para receber negócios sob medida para você. Se preferir, explore as ideias de negócios e favorite as que combinam com você.",
                  links: [
                    { href: diagnosticCta.href, texto: diagnosticCta.label },
                    { href: "/negocios", texto: "Explorar ideias de negócios" },
                  ],
                }
              : estados.negocios === "atual"
                ? {
                    texto:
                      "Seu diagnóstico está pronto. Veja os negócios personalizados ou favorite ideias do catálogo para escolher de onde sai o seu plano.",
                    links: [
                      { href: "/diagnostico/concluido", texto: "Meus negócios" },
                      { href: "/negocios", texto: "Explorar ideias de negócios" },
                    ],
                  }
                : estados.planos === "atual"
                  ? {
                      texto:
                        "Você já tem negócios para escolher. Crie o plano de execução de um deles: pode ser um dos personalizados ou um dos seus favoritos.",
                      links: [{ href: "/planos", texto: "Criar meu plano" }],
                    }
                  : estados.execucao === "feito"
                    ? {
                        texto: cota.esgotada
                          ? "Você concluiu todos os seus planos. Parabéns pela execução."
                          : `Você concluiu seus planos. Ainda dá para criar mais ${cota.restantes} (${cota.usados} de ${cota.limite} usados), de um negócio personalizado ou favorito.`,
                        links: cota.esgotada ? [] : [{ href: "/planos", texto: "Criar outro plano" }],
                      }
                    : null
          }
        />
        {diagnosticoConcluido ? (
          <p className="mt-5 text-[13px] text-ink-muted">
            Quer reler o que você respondeu?{" "}
            <a href="/diagnostico/respostas" className="font-semibold text-petrol hover:underline">
              Ver as respostas do meu diagnóstico →
            </a>
          </p>
        ) : null}
      </section>
    </div>
  );
}
