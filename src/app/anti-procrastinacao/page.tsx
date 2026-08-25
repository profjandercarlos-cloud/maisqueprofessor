import { AppHeader } from "@/components/app-header";
import { PapelIcon } from "@/components/papel-icon";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { ANTI_PROCRASTINACAO_ITENS } from "@/lib/anti-procrastinacao/itens";
import { salvarRespostas } from "./actions";

export default async function AntiProcrastinacaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;
  const salvo = query.salvo === "1";

  const user = await requireActiveAccess();

  const activePlan = await db.plan.findFirst({
    where: { userId: user.id, status: "ATIVO" },
    include: {
      possibility: true,
      antiProcrastinacaoRespostas: true,
    },
  });

  const respostaMap = new Map(
    (activePlan?.antiProcrastinacaoRespostas ?? []).map((r) => [r.itemKey, r.resposta]),
  );
  const itensRespondidos = ANTI_PROCRASTINACAO_ITENS.filter((item) =>
    (respostaMap.get(item.key) ?? "").trim(),
  );

  return (
    <div className="mx-auto w-full max-w-[720px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="ANTIPROCRASTINAÇÃO" />

      <h1 className="mb-1.5 font-serif text-2xl font-medium tracking-tight text-petrol">
        Antiprocrastinação
      </h1>
      <p className="mb-6 max-w-[560px] text-[13.5px] text-ink-muted">
        9 ideias de livros conhecidos sobre formação de hábitos, adaptadas pra execução do seu
        plano. Pra cada uma, pegue o plano, analise, e registre com suas palavras a ação que faz
        sentido pra você — ninguém vai preencher isso por você.
      </p>

      {!activePlan ? (
        <p className="text-[14px] text-ink-muted">
          Você ainda não tem um plano ativo — a antiprocrastinação se aplica ao plano em execução.{" "}
          <a href="/planos" className="font-semibold text-petrol hover:underline">
            Ver meus planos →
          </a>
        </p>
      ) : (
        <>
          <div className="mb-8 flex items-center gap-2">
            <PapelIcon papel={activePlan.possibility.papel} className="h-[15px] w-[15px] shrink-0 text-petrol" />
            <span className="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
              Plano ativo
            </span>
            <a
              href={`/planos/${activePlan.id}`}
              className="text-[13px] font-semibold text-petrol hover:underline"
            >
              {activePlan.possibility.titulo} →
            </a>
          </div>

          {salvo ? (
            <p className="mb-6 rounded-lg border border-line bg-gold-soft px-4 py-2.5 text-[13.5px] text-ink">
              Salvo.
            </p>
          ) : null}
          {error ? <p className="mb-6 text-sm text-role-3">{error}</p> : null}

          <form action={salvarRespostas.bind(null, activePlan.id)} className="flex flex-col gap-6">
            {ANTI_PROCRASTINACAO_ITENS.map((item, index) => (
              <div
                key={item.key}
                className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]"
              >
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="font-mono text-[11px] text-gold">{String(index + 1).padStart(2, "0")}</span>
                  <h2 className="font-serif text-[17px] font-medium text-petrol">{item.titulo}</h2>
                </div>
                <p className="mb-2 text-[11.5px] text-ink-muted italic">{item.fonte}</p>
                <p className="mb-4 text-[14px] leading-[1.6] text-ink">{item.explicacao}</p>

                <label htmlFor={item.key} className="mb-1.5 block text-[13px] font-medium text-ink">
                  {item.prompt}
                </label>
                <textarea
                  id={item.key}
                  name={item.key}
                  defaultValue={respostaMap.get(item.key) ?? ""}
                  placeholder="Sua ação..."
                  className="min-h-[70px] w-full resize-y rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-petrol"
                />
              </div>
            ))}

            <button
              type="submit"
              className="self-start rounded-lg bg-petrol px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft"
            >
              Salvar
            </button>
          </form>

          {itensRespondidos.length > 0 ? (
            <div className="mt-12 rounded-[var(--radius-app)] border border-petrol bg-paper-raised p-5 shadow-[var(--shadow)]">
              <span className="mb-3 block font-mono text-[10px] tracking-wide text-gold uppercase">
                Seu relatório
              </span>
              <h2 className="mb-4 font-serif text-lg font-medium text-petrol">
                Seu sistema antiprocrastinação — {activePlan.possibility.titulo}
              </h2>
              <ul className="flex flex-col gap-4">
                {itensRespondidos.map((item) => (
                  <li key={item.key}>
                    <p className="text-[13.5px] font-semibold text-ink">{item.titulo}</p>
                    <p className="text-[13.5px] text-ink-muted">{respostaMap.get(item.key)}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[12px] text-ink-muted">
                Pra guardar ou imprimir, use o comando de imprimir do navegador (Ctrl+P).
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
