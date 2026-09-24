import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { ROLE_META } from "@/lib/possibilidades/role-meta";
import { ESPECIFICACAO_TITULO } from "@/lib/especificacao/titulo";
import { responderAcao, enviarFeedbackEspecificacao } from "./actions";

// 300s — teto do plano Vercel Pro (era 120, ajustado pro Hobby).
export const maxDuration = 300;

const DIMENSAO_LABELS: Record<string, string> = {
  PUBLICO: "Quem é o público?",
  PROBLEMA: "Qual é o problema exato?",
  FORMATO: "Como o contato acontece?",
  EVIDENCIA: "O que confirma que é real?",
};

const CONCLUSAO_LABELS: Record<string, string> = {
  TOTAL: "Consegui concluir totalmente",
  PARCIAL: "Consegui concluir parcialmente",
  NAO: "Não consegui concluir",
};

export default async function EspecificacaoPage({
  params,
  searchParams,
}: PageProps<"/adequacao/[possibilityId]/especificacao">) {
  const { possibilityId } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: {
      round: { include: { diagnostic: true } },
      plan: true,
      acoesEspecificacao: { orderBy: { ordem: "asc" } },
    },
  });
  if (!possibility || possibility.round.diagnostic.userId !== user.id) notFound();
  if (possibility.plan) redirect(`/planos/${possibility.plan.id}`);
  if (possibility.acoesEspecificacao.length === 0) {
    redirect(`/adequacao/${possibilityId}/concluido`);
  }

  const todasRespondidas = possibility.acoesEspecificacao.every((a) => a.respondidoEm !== null);
  const jaTemFeedback = !!possibility.feedbackEspecificacao;

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
      <AppHeader progressLabel={`BLOCO 0 — ${ESPECIFICACAO_TITULO.toUpperCase()}`} />

      <div className="mb-[18px] flex flex-wrap items-center gap-2">
        <span className="inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
          Antes do seu plano
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full py-[3px] pr-[9px] pl-2 font-mono text-[10px] tracking-[0.07em] uppercase"
          style={{
            color: ROLE_META[possibility.papel].accentVar,
            background: `color-mix(in srgb, ${ROLE_META[possibility.papel].accentVar} 13%, var(--tint-base))`,
          }}
        >
          {ROLE_META[possibility.papel].icon}
          {ROLE_META[possibility.papel].label}
        </span>
      </div>
      <p className="mb-1.5 font-mono text-[11px] tracking-[0.06em] text-ink-muted uppercase">Possibilidade escolhida</p>
      <h1 className="mb-2 font-serif text-2xl leading-snug font-medium tracking-tight text-petrol md:text-[27px]">
        {possibility.titulo}
      </h1>
      <p className="mb-6 text-[13.5px] font-medium text-ink-muted">{ESPECIFICACAO_TITULO}</p>
      <p className="mb-8 max-w-[60ch] text-[14.5px] text-ink-muted">
        Antes de montar seu plano de várias semanas, vamos descobrir o recorte específico dessa possibilidade —
        quem é seu público, qual problema exato atacar, como o contato acontece — através de contato real, rápido
        e em pequena escala. Cada ação cabe numa única sessão. O que acontecer aqui vai calibrar seu plano de
        verdade.
      </p>

      {error ? <p className="mb-6 text-sm text-role-3">{error}</p> : null}

      <div className="flex flex-col gap-6">
        {possibility.acoesEspecificacao.map((acao) => {
          const passos = Array.isArray(acao.passoAPasso) ? (acao.passoAPasso as string[]) : [];
          const respondida = acao.respondidoEm !== null;
          const action = responderAcao.bind(null, possibilityId, acao.id);

          return (
            <div key={acao.id} className="rounded-xl border border-line bg-paper-raised p-5">
              <span className="mb-1 block font-mono text-[11px] tracking-[0.1em] text-badge-text uppercase">
                Ação {acao.ordem} — {DIMENSAO_LABELS[acao.dimensao] ?? acao.dimensao}
              </span>
              <h2 className="mb-1 font-serif text-lg font-medium text-petrol">{acao.nome}</h2>
              <p className="mb-3 text-[13.5px] text-ink-muted">{acao.objetivo}</p>

              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2 md:items-stretch">
                <dl className="flex flex-col gap-2 rounded-lg border border-line bg-paper p-3.5 text-[13.5px]">
                  <span className="mb-0.5 font-mono text-[10px] tracking-[0.08em] text-badge-text uppercase">
                    Sua ação
                  </span>
                  <div>
                    <dt className="font-semibold text-petrol">Por que essa ação existe</dt>
                    <dd className="text-ink-muted">{acao.porQueExiste}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-petrol">Tempo estimado</dt>
                    <dd className="text-ink-muted">{acao.tempoEstimadoMinutos} minutos</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-petrol">Você vai precisar de</dt>
                    <dd className="text-ink-muted">{acao.recursosNecessarios}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-petrol">Passo a passo</dt>
                    <dd>
                      <ol className="ml-4 list-decimal text-ink-muted">
                        {passos.map((passo, i) => (
                          <li key={i}>{passo}</li>
                        ))}
                      </ol>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-petrol">Você terminou quando</dt>
                    <dd className="text-ink-muted">{acao.criterioConclusao}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-petrol">Evidência esperada</dt>
                    <dd className="text-ink-muted">{acao.evidenciaEsperada}</dd>
                  </div>
                </dl>

                <div className="flex flex-col gap-2 rounded-lg border border-gold bg-gold-soft p-3.5 text-[13.5px]">
                  <span className="mb-0.5 font-mono text-[10px] tracking-[0.08em] text-gold uppercase">
                    Exemplo de alguém que já fez isso
                  </span>
                  <p className="text-ink-muted italic">{acao.exemploCenario}</p>
                  <div className="rounded-md border border-line bg-paper p-2.5 whitespace-pre-wrap text-ink">
                    {acao.exemploResultado}
                  </div>
                </div>
              </div>

              {respondida ? (
                <div className="rounded-lg bg-badge-bg p-3 text-[13.5px]">
                  <p className="font-semibold text-petrol">
                    ✓ {CONCLUSAO_LABELS[acao.conseguiuConcluir ?? ""] ?? "Respondida"}
                  </p>
                  <p className="mt-1 text-ink-muted">
                    <span className="font-medium text-ink">{acao.perguntaRegistro}</span> {acao.oQueAconteceu}
                  </p>
                  <p className="mt-1 text-ink-muted">
                    <span className="font-medium text-ink">{acao.perguntaReflexao}</span> {acao.reflexao}
                  </p>
                </div>
              ) : (
                <form action={action} className="flex flex-col gap-3 border-t border-line pt-3">
                  <label className="flex flex-col gap-1 text-[13.5px]">
                    <span className="font-semibold text-petrol">Você conseguiu concluir?</span>
                    <select name="conseguiuConcluir" required className="rounded-md border border-line px-2 py-1.5">
                      <option value="">Selecione</option>
                      <option value="total">Consegui concluir totalmente</option>
                      <option value="parcial">Consegui concluir parcialmente</option>
                      <option value="nao">Não consegui concluir</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[13.5px]">
                    <span className="font-semibold text-petrol">Quanto tempo levou de verdade (minutos)?</span>
                    <input
                      type="number"
                      name="tempoRealMinutos"
                      min={0}
                      max={600}
                      className="rounded-md border border-line px-2 py-1.5"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[13.5px]">
                    <span className="font-semibold text-petrol">{acao.perguntaRegistro}</span>
                    <textarea
                      name="oQueAconteceu"
                      required
                      maxLength={600}
                      rows={3}
                      className="rounded-md border border-line px-2 py-1.5"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[13.5px]">
                    <span className="font-semibold text-petrol">{acao.perguntaReflexao}</span>
                    <textarea
                      name="reflexao"
                      required
                      maxLength={600}
                      rows={3}
                      className="rounded-md border border-line px-2 py-1.5"
                    />
                  </label>
                  <SubmitButton
                    pendingText="Salvando..."
                    className="self-start rounded-lg bg-petrol px-4 py-2 text-sm font-semibold text-paper transition-colors hover:opacity-90"
                  >
                    Registrar esta ação →
                  </SubmitButton>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {todasRespondidas && !jaTemFeedback ? (
        <div className="mt-8 rounded-xl border border-line bg-paper-raised p-5">
          <h2 className="mb-3 font-serif text-lg font-medium text-petrol">Antes de calibrar seu plano</h2>
          <form action={enviarFeedbackEspecificacao.bind(null, possibilityId)} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-[13.5px]">
              <span className="font-semibold text-petrol">
                Depois de realizar essas ações, sua vontade de explorar essa possibilidade:
              </span>
              <select name="vontadeContinuar" required className="rounded-md border border-line px-2 py-1.5">
                <option value="">Selecione</option>
                <option value="aumentou">Aumentou</option>
                <option value="igual">Permaneceu igual</option>
                <option value="diminuiu">Diminuiu</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[13.5px]">
              <span className="font-semibold text-petrol">
                Depois de experimentar, quanto tempo você realmente consegue dedicar por semana? (deixe em
                branco se não mudou)
              </span>
              <input type="number" name="horasReaisPorSemana" min={0} max={40} step={0.5} className="rounded-md border border-line px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1 text-[13.5px]">
              <span className="font-semibold text-petrol">Alguma dificuldade principal nessas ações?</span>
              <select name="dificuldadePrincipal" className="rounded-md border border-line px-2 py-1.5">
                <option value="">Nenhuma em particular</option>
                <option value="falta_conhecimento">Falta de conhecimento</option>
                <option value="falta_tempo">Falta de tempo</option>
                <option value="falta_recurso">Falta de recurso</option>
                <option value="dificuldade_contato">Dificuldade de contato com pessoas</option>
                <option value="medo_inseguranca">Medo ou insegurança</option>
                <option value="outro">Outro motivo</option>
              </select>
            </label>
            <SubmitButton
              pendingText="Enviando..."
              className="self-start rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-paper transition-colors hover:opacity-90"
            >
              Concluir e calibrar meu plano →
            </SubmitButton>
          </form>
        </div>
      ) : null}
    </div>
  );
}
