import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { PapelIcon, PAPEL_LABELS } from "@/components/papel-icon";
import { ROLE_META, ROLE_ORDER } from "@/lib/possibilidades/role-meta";

// Mapa fixo da jornada do RAS — não mostra o mecanismo de ajuste seletivo
// nem a troca de possibilidades (é um caso à parte, deliberadamente fora
// deste mapa). Mostra só: Diagnóstico -> 5 possibilidades (uma raia por
// papel) -> Missões -> Plano -> Execução, com "você está aqui" calculado a
// partir do estado real de cada possibilidade.
type Estagio = "aberta" | "escolhida" | "missoes" | "plano" | "execucao" | "nao_seguida";

type EstagioProgresso = "escolhida" | "missoes" | "plano" | "execucao";
const ESTAGIO_ORDEM: EstagioProgresso[] = ["escolhida", "missoes", "plano", "execucao"];
const ESTAGIO_LABELS: Record<EstagioProgresso, string> = {
  escolhida: "Escolhida",
  missoes: "Missões",
  plano: "Plano",
  execucao: "Execução",
};

export default async function MapaPage() {
  const user = await requireActiveAccess();

  const diagnostic = await db.diagnostic.findFirst({
    where: { userId: user.id, status: "CONCLUIDO" },
    orderBy: { createdAt: "desc" },
  });

  const round = diagnostic
    ? await db.generationRound.findFirst({
        where: { diagnosticId: diagnostic.id, status: "CONCLUIDO" },
        orderBy: { roundNumber: "desc" },
        include: {
          possibilities: {
            include: {
              plan: { include: { weeks: { include: { checkin: true } } } },
              missoesAtivacao: true,
            },
          },
        },
      })
    : null;

  const possibilidades = round
    ? [...round.possibilities].sort((a, b) => ROLE_ORDER.indexOf(a.papel) - ROLE_ORDER.indexOf(b.papel))
    : [];

  function calcularEstagio(p: (typeof possibilidades)[number]): Estagio {
    if (p.status === "REJEITADA") return "nao_seguida";
    if (p.status !== "APROVADA") return "aberta";
    if (!p.plan) {
      if (p.missoesAtivacao.length === 0) return "escolhida";
      const missoesCompletas = p.missoesAtivacao.every((m) => m.respondidoEm !== null) && !!p.feedbackMissoesAtivacao;
      return missoesCompletas ? "plano" : "missoes";
    }
    const teveCheckin = p.plan.weeks.some((w) => w.checkin !== null);
    return teveCheckin ? "execucao" : "plano";
  }

  return (
    <div className="mx-auto w-full max-w-[820px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="MAPA DA JORNADA" />
      <h1 className="mb-2 font-serif text-2xl font-medium tracking-tight text-petrol">Como o RAS funciona</h1>
      <p className="mb-9 max-w-[60ch] text-[14.5px] text-ink-muted">
        Um diagnóstico gera cinco possibilidades. Você pode seguir qualquer uma delas até um Plano
        Personalizado de Transição — as outras quatro continuam disponíveis, mesmo depois de você avançar
        numa.
      </p>

      {/* Diagnóstico — o tronco do mapa */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[11px] font-semibold"
          style={{
            borderColor: "var(--petrol)",
            color: "var(--petrol)",
            background: diagnostic ? "var(--petrol)" : "transparent",
            ...(diagnostic ? { color: "var(--paper)" } : {}),
          }}
        >
          {diagnostic ? "✓" : "1"}
        </div>
        <div>
          <p className="font-serif text-[15px] font-medium text-petrol">Diagnóstico</p>
          <p className="text-[12px] text-ink-muted">
            {diagnostic ? "Concluído" : "Ainda não concluído"}
          </p>
        </div>
        {!diagnostic ? (
          <span className="ml-1 flex h-2.5 w-2.5 shrink-0 animate-ping rounded-full bg-gold" aria-hidden />
        ) : null}
      </div>

      {/* Linha vertical do tronco até as 5 raias */}
      <div className="ml-[21px] h-6 w-px bg-line" />

      {!round ? (
        <div className="ml-8 rounded-[var(--radius-app)] border border-line bg-paper-raised px-4 py-3.5 text-[13.5px] text-ink-muted">
          {diagnostic
            ? "Suas cinco possibilidades ainda não foram geradas."
            : "As cinco possibilidades aparecem aqui depois do diagnóstico."}
        </div>
      ) : (
        <div className="ml-8 flex flex-col gap-4">
          {possibilidades.map((p) => {
            const meta = ROLE_META[p.papel];
            const estagio = calcularEstagio(p);

            return (
              <div
                key={p.id}
                className="rounded-[var(--radius-app)] border px-4 py-3.5"
                style={{
                  borderColor: estagio === "nao_seguida" ? "var(--line)" : meta.accentVar,
                  opacity: estagio === "nao_seguida" ? 0.55 : 1,
                }}
              >
                <div className="mb-2.5 flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ color: meta.accentVar, background: `color-mix(in srgb, ${meta.accentVar} 16%, var(--tint-base))` }}
                  >
                    <PapelIcon papel={p.papel} className="h-[15px] w-[15px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-[0.06em] uppercase" style={{ color: meta.accentVar }}>
                      {PAPEL_LABELS[p.papel]}
                    </p>
                    <p className="truncate font-serif text-[14.5px] font-medium text-ink">{p.titulo}</p>
                  </div>
                </div>

                {estagio === "nao_seguida" ? (
                  <p className="pl-[38px] text-[12.5px] text-ink-muted">Não seguida.</p>
                ) : estagio === "aberta" ? (
                  <p className="pl-[38px] text-[12.5px] text-ink-muted">Ainda disponível — você pode seguir por aqui quando quiser.</p>
                ) : (
                  <div className="flex items-center gap-1 pl-[30px]">
                    {ESTAGIO_ORDEM.map((etapa, i) => {
                      const indiceAtual = ESTAGIO_ORDEM.indexOf(estagio as (typeof ESTAGIO_ORDEM)[number]);
                      const alcancada = i <= indiceAtual;
                      const atual = i === indiceAtual;
                      return (
                        <div key={etapa} className="flex flex-1 items-center gap-1">
                          {i > 0 ? (
                            <div
                              className="h-px flex-1"
                              style={{ background: alcancada ? meta.accentVar : "var(--line)" }}
                            />
                          ) : null}
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className="relative flex h-3 w-3 shrink-0 items-center justify-center rounded-full"
                              style={{ background: alcancada ? meta.accentVar : "var(--line)" }}
                            >
                              {atual ? (
                                <span
                                  className="absolute inset-0 animate-ping rounded-full"
                                  style={{ background: meta.accentVar }}
                                  aria-hidden
                                />
                              ) : null}
                            </span>
                            <span
                              className="whitespace-nowrap text-[10.5px] font-medium"
                              style={{ color: atual ? meta.accentVar : "var(--ink-muted)" }}
                            >
                              {ESTAGIO_LABELS[etapa]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
