import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { FichaProfessorView } from "@/components/ficha-professor";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { getTipoAcesso, requireUser } from "@/lib/auth/require-active-access";
import { montarLinkCompra } from "@/lib/hotmart/checkout";
import { lerFicha, numerosDaFicha, type FichaProfessor } from "@/lib/negocios/ficha";
import { LIMITE_LISTA, PLANOS_DA_LISTA_DISPONIVEIS, listaCheia, vagasNaLista } from "@/lib/negocios/lista";
import { CATEGORIA_LABELS } from "@/lib/negocios/tags";
import { adicionarNaLista, removerDaLista } from "../actions";

const botaoPrimario =
  "rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90";

export default async function NegocioPage({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { codigo } = await params;
  const query = await searchParams;

  const user = await requireUser();
  const negocio = await db.pequenoNegocio.findFirst({
    where: { codigo, status: "APROVADO", fichaGeradaEm: { not: null } },
    include: { subcategoria: true },
  });
  const ficha = negocio ? lerFicha(negocio.ficha) : null;
  if (!negocio || !ficha) notFound();

  const [tipo, dbUser, naLista] = await Promise.all([
    getTipoAcesso(user.id),
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } }),
    db.negocioNaLista.findMany({ where: { userId: user.id }, select: { negocioId: true } }),
  ]);
  const pago = tipo === "pago";
  const estaNaLista = naLista.some((l) => l.negocioId === negocio.id);
  const linkCompra = montarLinkCompra(dbUser?.email ?? user.email, dbUser?.name);
  const voltarPara = `/negocios/${negocio.codigo}`;

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PEQUENOS NEGÓCIOS" />

      <a href="/negocios" className="mb-4 inline-block text-[13px] font-semibold text-petrol hover:underline">
        ← Todos os pequenos negócios
      </a>

      <div className="mb-5">
        <p className="mb-1.5 font-mono text-[10.5px] tracking-wide text-ink-muted uppercase">
          {CATEGORIA_LABELS[negocio.categoria]} · {negocio.subcategoria.nome}
        </p>
        <h1 className="font-serif text-[clamp(25px,5vw,32px)] leading-[1.15] font-medium tracking-tight text-petrol">
          {negocio.nome}
        </h1>
      </div>

      <FichaProfessorView ficha={ficha} numeros={numerosDaFicha(negocio)} />

      <BlocoLista
        ficha={ficha}
        estaNaLista={estaNaLista}
        qtdNaLista={naLista.length}
        erroListaCheia={query.erro === "lista-cheia"}
        pago={pago}
        linkCompra={linkCompra}
        adicionar={adicionarNaLista.bind(null, negocio.codigo, voltarPara)}
        remover={removerDaLista.bind(null, negocio.codigo, voltarPara)}
      />
    </div>
  );
}

function BlocoLista({
  ficha,
  estaNaLista,
  qtdNaLista,
  erroListaCheia,
  pago,
  linkCompra,
  adicionar,
  remover,
}: {
  ficha: FichaProfessor;
  estaNaLista: boolean;
  qtdNaLista: number;
  erroListaCheia: boolean;
  pago: boolean;
  linkCompra: string | null;
  adicionar: () => Promise<void>;
  remover: () => Promise<void>;
}) {
  const vagas = vagasNaLista(qtdNaLista);
  const cheia = listaCheia(qtdNaLista);

  return (
    <section className="mt-6 rounded-[var(--radius-app)] border border-gold bg-paper-raised p-5">
      {PLANOS_DA_LISTA_DISPONIVEIS ? (
        <>
          <h2 className="mb-1.5 font-serif text-[19px] font-medium tracking-tight text-petrol">
            E agora, o que você faz com isso?
          </h2>
          <p className="mb-4 text-[14.5px] leading-[1.6] text-ink">
            Você já sabe o quê. Falta a parte que ninguém faz por você: a sua semana. O plano de execução transforma
            este negócio em tarefas com data, e cada tarefa diz quando ela está feita.
          </p>
          <div className="mb-4 rounded-lg bg-paper px-4 py-3">
            <p className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
              Amostra de como é um plano
            </p>
            <p className="mb-1 text-[14px] font-semibold text-petrol">{ficha.amostraPlano.titulo}</p>
            <p className="text-[13.5px] text-ink">{ficha.amostraPlano.tarefa}</p>
            <p className="mt-1 text-[13px] text-ink-muted">Feito quando: {ficha.amostraPlano.feitoQuando}</p>
          </div>
        </>
      ) : (
        <>
          <h2 className="mb-1.5 font-serif text-[19px] font-medium tracking-tight text-petrol">
            Guarde este negócio na sua lista
          </h2>
          <p className="mb-4 text-[14.5px] leading-[1.6] text-ink">
            Você pode escolher até {LIMITE_LISTA} pequenos negócios e voltar a eles com calma, para comparar antes de
            decidir por onde começar.
          </p>
        </>
      )}

      {erroListaCheia ? (
        <p className="mb-3 rounded-lg border border-role-3 bg-paper px-3.5 py-2.5 text-[13.5px] text-role-3">
          Sua lista já tem {LIMITE_LISTA} negócios. Remova um dela para adicionar este.
        </p>
      ) : null}

      {estaNaLista ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gold-soft px-3 py-1 font-mono text-[11px] font-semibold tracking-wide text-petrol uppercase">
            Na sua lista · {qtdNaLista} de {LIMITE_LISTA}
          </span>
          <a href="/negocios/lista" className={botaoPrimario}>
            Ver minha lista
          </a>
          <form action={remover}>
            <SubmitButton
              pendingText="Removendo..."
              className="text-[13px] font-semibold text-ink-muted hover:text-petrol hover:underline"
            >
              Remover da lista
            </SubmitButton>
          </form>
        </div>
      ) : cheia ? (
        <p className="text-[14px] text-ink">
          Sua lista está cheia ({LIMITE_LISTA} de {LIMITE_LISTA}).{" "}
          <a href="/negocios/lista" className="font-semibold text-petrol hover:underline">
            Veja a lista para trocar um negócio
          </a>
          .
        </p>
      ) : (
        <form action={adicionar} className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText="Adicionando..." className={botaoPrimario}>
            Adicionar à minha lista de {LIMITE_LISTA}
          </SubmitButton>
          <span className="text-[13px] text-ink-muted">
            {qtdNaLista === 0 ? `Você pode escolher até ${LIMITE_LISTA}.` : `Restam ${vagas} de ${LIMITE_LISTA}.`}
          </span>
        </form>
      )}

      {!PLANOS_DA_LISTA_DISPONIVEIS && !pago && linkCompra ? (
        <p className="mt-4 text-[13px] text-ink-muted">
          O acesso completo libera o questionário e o plano personalizado de execução.{" "}
          <a href={linkCompra} className="font-semibold text-petrol hover:underline">
            Conhecer o acesso completo →
          </a>
        </p>
      ) : null}
    </section>
  );
}
