import { AppHeader } from "@/components/app-header";
import { FavoritoButton } from "@/components/favorito-button";
import { db } from "@/lib/db";
import { getTipoAcesso, requireUser } from "@/lib/auth/require-active-access";
import { montarLinkCompra } from "@/lib/hotmart/checkout";
import { lerFicha } from "@/lib/negocios/ficha";
import { PLANOS_DOS_FAVORITOS_DISPONIVEIS, PLANOS_POR_CONTA } from "@/lib/negocios/favoritos";
import { CATEGORIA_LABELS } from "@/lib/negocios/tags";

export default async function MeusFavoritosPage() {
  const user = await requireUser();

  const [tipo, dbUser, itens] = await Promise.all([
    getTipoAcesso(user.id),
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } }),
    db.negocioNaLista.findMany({
      where: { userId: user.id, negocio: { status: "APROVADO", fichaGeradaEm: { not: null } } },
      include: { negocio: true },
      orderBy: { createdAt: "desc" },
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

      <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">Meus favoritos</h1>
      <p className="mb-6 text-[14.5px] text-ink-muted">
        {qtd === 0
          ? "Os negócios que você favoritar aparecem aqui."
          : `${qtd} ${qtd === 1 ? "negócio favoritado" : "negócios favoritados"}.`}
      </p>

      {qtd === 0 ? (
        <div className="rounded-[var(--radius-app)] border border-dashed border-line bg-paper-raised p-6 text-[14.5px] text-ink-muted">
          Você ainda não favoritou nenhum negócio. Toque no coração de um negócio para guardá-lo aqui.{" "}
          <a href="/negocios" className="font-semibold text-petrol hover:underline">
            Ver os negócios
          </a>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {itens.map(({ id, negocio }) => {
            const ficha = lerFicha(negocio.ficha);
            return (
              <li key={id} className="relative">
                <a
                  href={`/negocios/${negocio.codigo}`}
                  className="block rounded-[var(--radius-app)] border border-line bg-paper-raised py-4 pr-14 pl-4 transition-colors hover:border-petrol"
                >
                  <span className="mb-0.5 block font-mono text-[10.5px] tracking-wide text-ink-muted uppercase">
                    {CATEGORIA_LABELS[negocio.categoria]}
                  </span>
                  <span className="block font-serif text-[18px] font-medium text-petrol">{negocio.nome}</span>
                  {ficha ? (
                    <span className="mt-1 line-clamp-2 block text-[13.5px] leading-[1.5] text-ink-muted">
                      {ficha.vende}
                    </span>
                  ) : null}
                </a>
                <div className="absolute top-3 right-3">
                  <FavoritoButton codigo={negocio.codigo} favorito />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {qtd > 0 ? (
        <section className="mt-8 rounded-[var(--radius-app)] border border-gold bg-paper-raised p-5">
          {PLANOS_DOS_FAVORITOS_DISPONIVEIS ? (
            <>
              <h2 className="mb-1.5 font-serif text-[19px] font-medium tracking-tight text-petrol">
                Transforme seus favoritos em planos de execução
              </h2>
              <p className="mb-4 text-[14.5px] leading-[1.6] text-ink">
                Escolha até {PLANOS_POR_CONTA} dos seus favoritos. Cada um vira um plano com tarefas e data, e um
                critério claro de &quot;feito&quot;, com check-in semanal para você ajustar quando a semana não sair
                como previsto. Você começa por um plano e abre os outros quando estiver pronto.
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
                Seus favoritos ficam guardados aqui
              </h2>
              <p className="text-[14.5px] leading-[1.6] text-ink">
                Volte quando quiser para comparar e decidir por onde começar.
                {!pago ? " O acesso completo libera o questionário e o plano personalizado de execução." : ""}
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
