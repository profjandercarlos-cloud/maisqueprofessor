import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { listarRespostas } from "@/lib/ai-engine/format-diagnostic-input";

// Só leitura: as respostas do diagnóstico concluído, do jeito que a IA as recebeu.
// Mudar respostas não é possível aqui: os negócios gerados partem delas.
export default async function MinhasRespostasPage() {
  const user = await requireActiveAccess();
  const diagnostic = await db.diagnostic.findFirst({
    where: { userId: user.id, status: "CONCLUIDO" },
    orderBy: { createdAt: "desc" },
  });

  if (!diagnostic) {
    return (
      <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
        <AppHeader progressLabel="MINHAS RESPOSTAS" />
        <h1 className="mb-3 font-serif text-2xl font-medium tracking-tight text-petrol">Minhas respostas</h1>
        <p className="mb-5 text-[14.5px] text-ink-muted">Você ainda não concluiu o diagnóstico.</p>
        <a href="/" className="text-[13px] font-semibold text-petrol hover:underline">
          ← Voltar ao Painel
        </a>
      </div>
    );
  }

  const blocos = listarRespostas(diagnostic);

  return (
    <div className="mx-auto w-full max-w-[720px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="MINHAS RESPOSTAS" />
      <a href="/" className="mb-4 inline-block text-[13px] font-semibold text-petrol hover:underline">
        ← Painel
      </a>
      <h1 className="mb-2 font-serif text-2xl font-medium tracking-tight text-petrol">Minhas respostas</h1>
      <p className="mb-8 max-w-[60ch] text-[14.5px] text-ink-muted">
        Estas são as respostas do seu diagnóstico, a base dos negócios que geramos para você. Elas ficam só para
        leitura.
      </p>

      <div className="flex flex-col gap-8">
        {blocos.map((bloco) => (
          <section key={bloco.titulo}>
            <h2 className="mb-3 font-mono text-[11px] tracking-[0.08em] text-gold uppercase">{bloco.titulo}</h2>
            <dl className="flex flex-col gap-4 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
              {bloco.itens.map((item, i) => (
                <div key={i}>
                  <dt className="mb-1 text-[13px] font-semibold text-ink">{item.pergunta}</dt>
                  <dd className="text-[14px] leading-[1.55] whitespace-pre-line text-ink-muted">{item.resposta}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
