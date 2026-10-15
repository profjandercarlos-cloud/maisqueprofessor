import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { getTipoAcesso, requireUser } from "@/lib/auth/require-active-access";
import { montarLinkCompra } from "@/lib/hotmart/checkout";
import { lerFicha } from "@/lib/negocios/ficha";
import { LIMITE_LISTA, PLANOS_DA_LISTA_DISPONIVEIS, listaCheia, vagasNaLista } from "@/lib/negocios/lista";
import { CATEGORIA_LABELS } from "@/lib/negocios/tags";
import { removerDaLista } from "../actions";

export default async function MinhaListaPage() {
  const user = await requireUser();

  const [tipo, dbUser, itens] = await Promise.all([
    getTipoAcesso(user.id),
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } }),
    db.negocioNaLista.findMany({
      where: { userId: user.id },
      include: { negocio: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const pago = tipo === "pago";
  const linkCompra = montarLinkCompra(dbUser?.email ?? user.email, dbUser?.name);
  const qtd = itens.length;

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PEQUENOS NEGÓCIOS" />

      <a href="/negocios" className="mb-4 inline-block text-[13px] font-semibold text-petrol hover:underline">
        ← Todos os pequenos negócios
      </a>

      <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">Minha lista</h1>
      <p className="mb-6 text-[14.5px] text-ink-muted">
        {qtd} de {LIMITE_LISTA} negócios escolhidos
        {qtd > 0 && !listaCheia(qtd) ? `. Você ainda pode adicionar mais ${vagasNaLista(qtd)}.` : "."}
      </p>

      {qtd === 0 ? (
        <div className="rounded-[var(--radius-app)] border border-dashed border-line bg-paper-raised p-6 text-[14.5px] text-ink-muted">
          Sua lista está vazia. Abra um pequeno negócio e use o botão <b className="text-petrol">Adicionar à minha lista</b>{" "}
          no fim da página.{" "}
          <a href="/negocios" className="font-semibold text-petrol hover:underline">
            Ver os negócios
          </a>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {itens.map(({ id, negocio }) => {
            const ficha = lerFicha(negocio.ficha);
            return (
              <li key={id} className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-4">
                <p className="mb-0.5 font-mono text-[10.5px] tracking-wide text-ink-muted uppercase">
                  {CATEGORIA_LABELS[negocio.categoria]}
                </p>
                <a href={`/negocios/${negocio.codigo}`} className="font-serif text-[18px] font-medium text-petrol hover:underline">
                  {negocio.nome}
                </a>
                {ficha ? <p className="mt-1 text-[13.5px] leading-[1.5] text-ink-muted">{ficha.vende}</p> : null}
                <form action={removerDaLista.bind(null, negocio.codigo, "/negocios/lista")} className="mt-2.5">
                  <SubmitButton
                    pendingText="Removendo..."
                    className="text-[13px] font-semibold text-ink-muted hover:text-petrol hover:underline"
                  >
                    Remover da lista
                  </SubmitButton>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {qtd > 0 ? (
        <section className="mt-8 rounded-[var(--radius-app)] border border-gold bg-paper-raised p-5">
          {PLANOS_DA_LISTA_DISPONIVEIS ? (
            <>
              <h2 className="mb-1.5 font-serif text-[19px] font-medium tracking-tight text-petrol">
                {listaCheia(qtd)
                  ? `Transforme estes ${qtd} negócios em ${qtd} planos de execução`
                  : `Transforme seus ${qtd} negócios em planos de execução`}
              </h2>
              <p className="mb-4 text-[14.5px] leading-[1.6] text-ink">
                Cada plano vira tarefas com data e um critério claro de &quot;feito&quot;, com check-in semanal para
                você ajustar quando a semana não sair como previsto. Você começa por um plano e abre os outros quando
                estiver pronto.
              </p>
              {!pago && linkCompra ? (
                <a
                  href={linkCompra}
                  className="inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
                >
                  Quero meus planos de execução →
                </a>
              ) : null}
            </>
          ) : (
            <>
              <h2 className="mb-1.5 font-serif text-[19px] font-medium tracking-tight text-petrol">
                Sua lista fica guardada aqui
              </h2>
              <p className="text-[14.5px] leading-[1.6] text-ink">
                Volte quando quiser para comparar e decidir por onde começar.
                {!pago
                  ? " O acesso completo libera o questionário e o plano personalizado de execução."
                  : ""}
              </p>
              {!pago && linkCompra ? (
                <a
                  href={linkCompra}
                  className="mt-3 inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
                >
                  Conhecer o acesso completo →
                </a>
              ) : null}
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
