import { notFound } from "next/navigation";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { IdeiaView } from "@/components/ideia-view";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { categoriaDaIdeia } from "@/lib/ideias/categorias";
import { fonteOriginalSchema, lerConteudo } from "@/lib/ideias/conteudo";
import { z } from "zod";
import { ajustarIdeia, regenerarIdeia, revisarIdeia, reverterIdeia } from "../actions";

// Ajustar e regenerar chamam a IA (dezenas de segundos até ~1 min).
export const maxDuration = 300;

const STATUS_LABELS: Record<string, string> = {
  PENDENTE_REVISAO: "Pendente de revisão",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  PENDENTE_REVISAO: "bg-yellow-200 text-yellow-900",
  APROVADO: "bg-green-200 text-green-900",
  REJEITADO: "bg-red-200 text-red-900",
};

const botaoClass = "rounded-lg px-4 py-2 text-[13.5px] font-semibold";

export default async function IdeiaAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const ideia = await db.ideiaNegocio.findUnique({ where: { id } });
  if (!ideia) notFound();

  const returnTo = `/admin/pequenos-negocios/${id}`;
  const conteudo = lerConteudo(ideia.conteudo);
  const fontes = z
    .array(fonteOriginalSchema)
    .catch([])
    .parse((ideia.dados as { fontes?: unknown } | null)?.fontes);

  return (
    <div className="flex flex-col gap-5">
      <a href="/admin/pequenos-negocios" className="text-[13px] font-semibold text-petrol hover:underline">
        ← Todas as ideias de negócios
      </a>

      {error ? (
        <p className="rounded-lg border border-role-3 bg-paper px-4 py-2.5 text-[13.5px] text-role-3">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className={`rounded-full px-2.5 py-[3px] font-mono text-[10.5px] tracking-wide uppercase ${STATUS_BADGE_COLORS[ideia.status]}`}
        >
          {STATUS_LABELS[ideia.status]}
        </span>
        <span className="text-[12.5px] text-ink-muted">
          {ideia.conteudoEditadoEm ? "Texto ajustado pela IA · " : "Texto original do arquivo · "}
          é assim que o professor vê esta ideia
        </span>
      </div>

      {conteudo ? (
        <IdeiaView conteudo={conteudo} categoria={categoriaDaIdeia(ideia.categoria)?.nome ?? ""} />
      ) : (
        <p className="rounded-lg border border-role-3 bg-paper px-4 py-2.5 text-[13.5px] text-role-3">
          O conteúdo desta ideia está inválido. Use &quot;Reverter ao original&quot; abaixo.
        </p>
      )}

      <section className="rounded-[var(--radius-app)] border border-gold bg-paper-raised p-5">
        <p className="mb-1 font-serif text-lg font-medium tracking-tight text-petrol">Revisão</p>
        {ideia.notaRevisao ? (
          <p className="mb-3 rounded-lg bg-gold-soft px-3.5 py-2.5 text-[13.5px] text-ink">
            <span className="font-semibold text-petrol">Nota atual:</span> {ideia.notaRevisao}
          </p>
        ) : null}

        <form className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-[13.5px]">
            <span className="font-semibold text-petrol">Observação</span>
            <span className="text-[12.5px] text-ink-muted">
              Instrução para a IA ao ajustar ou regenerar. Ao deixar pendente ou rejeitar, vira a nota de revisão.
            </span>
            <textarea
              name="observacao"
              rows={3}
              placeholder="Ex.: simplifique o segundo parágrafo; o exemplo prático precisa citar uma escola."
              className="rounded-md border border-line px-3 py-2 text-[13.5px]"
            />
          </label>

          <div>
            <p className="mb-2 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">Decisão</p>
            <div className="flex flex-wrap gap-2.5">
              <SubmitButton
                pendingText="Aprovando..."
                formAction={revisarIdeia.bind(null, returnTo, id, "APROVADO")}
                className={`${botaoClass} bg-gold text-paper hover:opacity-90`}
              >
                Aprovar
              </SubmitButton>
              <SubmitButton
                pendingText="Salvando..."
                formAction={revisarIdeia.bind(null, returnTo, id, "PENDENTE_REVISAO")}
                className={`${botaoClass} border border-line text-ink hover:border-petrol hover:text-petrol`}
              >
                Deixar pendente
              </SubmitButton>
              <SubmitButton
                pendingText="Rejeitando..."
                formAction={revisarIdeia.bind(null, returnTo, id, "REJEITADO")}
                className={`${botaoClass} border border-role-3 text-role-3 hover:bg-paper`}
              >
                Rejeitar
              </SubmitButton>
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">Texto</p>
            <div className="flex flex-wrap gap-2.5">
              <SubmitButton
                pendingText="Ajustando (até 1 minuto)..."
                formAction={ajustarIdeia.bind(null, returnTo, id)}
                className={`${botaoClass} border border-petrol text-petrol hover:bg-gold-soft`}
              >
                Ajustar com IA (mantém o resto)
              </SubmitButton>
              <BotaoConfirmar
                pendingText="Regenerando (até 1 minuto)..."
                confirmacao="Regenerar do zero escreve os textos de novo a partir do original e descarta o texto atual. Continuar?"
                formAction={regenerarIdeia.bind(null, returnTo, id)}
                className={`${botaoClass} border border-line text-ink hover:border-petrol hover:text-petrol`}
              >
                Regenerar do zero
              </BotaoConfirmar>
              <BotaoConfirmar
                pendingText="Revertendo..."
                confirmacao="Reverter ao original volta ao texto do arquivo importado e descarta qualquer ajuste. Continuar?"
                formAction={reverterIdeia.bind(null, returnTo, id)}
                className={`${botaoClass} border border-line text-ink hover:border-petrol hover:text-petrol`}
              >
                Reverter ao original
              </BotaoConfirmar>
            </div>
            <p className="mt-2 text-[12.5px] text-ink-muted">
              <b>Ajustar</b> muda só o que a observação pede (a observação é obrigatória). <b>Regenerar</b> reescreve
              tudo a partir do original. <b>Reverter</b> volta ao texto do arquivo, sem IA. Números e horas nunca são
              alterados pela IA.
            </p>
          </div>
        </form>
      </section>

      {fontes.length > 0 ? (
        <details className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
          <summary className="cursor-pointer font-serif text-[15px] font-medium text-petrol">
            Base consultada (só no admin, {fontes.length})
          </summary>
          <p className="mt-2 mb-3 text-[12.5px] text-ink-muted">
            As fontes oferecem sinais de mercado e não validam os preços nem o resultado da simulação.
          </p>
          <ul className="flex flex-col gap-2">
            {fontes.map((f) => (
              <li key={f.id} className="text-[13px] leading-[1.5] text-ink">
                <span className="font-mono text-[11px] text-gold">{f.id}</span>{" "}
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noreferrer" className="font-medium text-petrol hover:underline">
                    {f.titulo}
                  </a>
                ) : (
                  <span className="font-medium">{f.titulo}</span>
                )}
                <span className="text-ink-muted">
                  {f.autor ? ` — ${f.autor}` : ""}
                  {f.periodo ? ` (${f.periodo})` : ""}
                </span>
                {f.alcance_e_limite ? (
                  <span className="block text-[12px] text-ink-muted">{f.alcance_e_limite}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
