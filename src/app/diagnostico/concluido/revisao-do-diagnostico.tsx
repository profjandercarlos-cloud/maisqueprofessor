import type { Diagnostic } from "@/generated/prisma/client";
import { SubmitButton } from "@/components/submit-button";
import { avisosDeQualidade, type AvisoDeQualidade } from "@/lib/diagnostico/qualidade";
import { obterRevisao } from "@/lib/diagnostico/revisao";
import { getStepBySlug, getStepsForRoute, ROTA_PROFISSIONAL_SLUG } from "@/lib/diagnostico/steps";
import { generateForActiveDiagnostic } from "./actions";

export function CarregandoRevisao() {
  return (
    <div className="mb-6 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5" role="status">
      <p className="font-serif text-[18px] font-medium tracking-tight text-petrol">Lendo as suas respostas...</p>
      <p className="mt-1 text-[13.5px] text-ink-muted motion-safe:animate-pulse">
        Estamos montando um resumo do que entendemos de você, para você conferir antes de gerar os negócios.
      </p>
    </div>
  );
}

// A conferência antes de gerar: o que a IA entendeu, os pontos que parecem fugir do que a pergunta
// pediu (por regra e pela leitura da IA) e o botão de gerar. Nada aqui bloqueia: é uma chance de
// corrigir, e quem achar que está certo segue direto.
export async function RevisaoDoDiagnostico({ diagnostic }: { diagnostic: Diagnostic }) {
  const rota = diagnostic.rotaProfissional;
  const resumo = await obterRevisao(diagnostic);

  const porRegra = avisosDeQualidade(diagnostic.answers as Record<string, unknown>, rota);
  const jaApontados = new Set(porRegra.map((a) => a.slug));
  const avisos: AvisoDeQualidade[] = [
    ...porRegra,
    ...(resumo?.pontosFracos ?? []).filter((p) => !jaApontados.has(p.slug)),
  ].slice(0, 5);

  const perguntasCorrigiveis = getStepsForRoute(rota).filter(
    (s) => s.type !== "intention" && s.slug !== ROTA_PROFISSIONAL_SLUG,
  );

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
        <h2 className="mb-3 font-serif text-[18px] font-medium tracking-tight text-petrol">O que entendemos de você</h2>
        {resumo && resumo.entendi.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {resumo.entendi.map((frase) => (
              <li key={frase} className="flex gap-2.5 text-[14.5px] leading-[1.55] text-ink">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                <span>{frase}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] leading-[1.55] text-ink-muted">
            Não conseguimos montar o resumo agora, mas as suas respostas estão salvas e você pode gerar os negócios.
          </p>
        )}
        {resumo?.meta ? (
          <p className="mt-4 border-t border-line pt-3 text-[14px] leading-[1.55] text-ink">
            <span className="font-semibold">Sua meta, como lemos:</span> {resumo.meta}
          </p>
        ) : null}
      </section>

      {avisos.length > 0 ? (
        <section className="rounded-[var(--radius-app)] border border-gold bg-gold-soft p-5">
          <h2 className="mb-1 font-serif text-[18px] font-medium tracking-tight text-petrol">Vale rever antes de gerar</h2>
          <p className="mb-4 text-[13.5px] leading-[1.55] text-ink-muted">
            Não é obrigatório. Se a resposta está como você quis, pode seguir. Se não, corrigir agora deixa os negócios
            mais certos para você.
          </p>
          <ul className="flex flex-col gap-4">
            {avisos.map((aviso, i) => (
              <li key={`${aviso.slug}-${i}`}>
                <p className="mb-0.5 text-[12px] text-ink-muted">{getStepBySlug(aviso.slug, rota)?.question}</p>
                <p className="text-[14px] leading-[1.55] text-ink">{aviso.motivo}</p>
                <a
                  href={`/diagnostico/${aviso.slug}?revisao=1`}
                  className="mt-1 inline-block text-[13px] font-semibold text-petrol hover:underline"
                >
                  Rever esta resposta →
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <details className="rounded-[var(--radius-app)] border border-line bg-paper-raised px-5 py-3">
        <summary className="cursor-pointer text-[13.5px] font-semibold text-petrol">Corrigir outra resposta</summary>
        <ul className="mt-3 flex flex-col gap-2">
          {perguntasCorrigiveis.map((s) => (
            <li key={s.slug}>
              <a href={`/diagnostico/${s.slug}?revisao=1`} className="text-[13.5px] leading-[1.5] text-ink hover:underline">
                {s.question}
              </a>
            </li>
          ))}
        </ul>
      </details>

      <form action={generateForActiveDiagnostic} className="pt-1">
        <SubmitButton
          pendingText="Preparando sua geração..."
          className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
        >
          Está certo, gerar meus 5 negócios →
        </SubmitButton>
      </form>
    </div>
  );
}
