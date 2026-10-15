import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { getTipoAcesso, requireUser } from "@/lib/auth/require-active-access";
import { montarLinkCompra } from "@/lib/hotmart/checkout";
import {
  CATEGORIA_LABELS,
  EVIDENCIA_LABELS,
  FORMA_TIPO_LABELS,
  HABILIDADE_LABELS,
  TAG_LABELS,
} from "@/lib/negocios/tags";
import {
  LIMITE_DESBLOQUEIOS_GRATUITOS,
  desbloqueiosRestantes,
  nivelDeVisao,
  projetarNegocio,
  type FormaDeComecar,
} from "@/lib/negocios/visibilidade";
import { desbloquearNegocio } from "../actions";

const sectionClass = "rounded-[var(--radius-app)] border border-line bg-paper-raised p-5";
const eyebrowClass = "mb-3 font-mono text-[10px] tracking-[0.06em] text-gold uppercase";
const labelClass = "mb-0.5 text-[12px] font-semibold text-petrol";
const valueClass = "text-[13.5px] leading-[1.5] text-ink";

const DOCENCIA_LABELS: Record<string, string> = {
  ENSINO_FORA_DA_ESCOLA: "Ensino fora da escola",
  EDUCACAO_SEM_AULA: "Educação, sem dar aula",
  OUTRO_SETOR: "Outro setor",
};

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value ?? "—"}</p>
    </div>
  );
}

function Cadeado() {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      <rect x="3.5" y="8" width="11" height="7" rx="1.6" />
      <path d="M6 8V5.8a3 3 0 016 0V8" />
    </svg>
  );
}

function reais(min: number | null | undefined, max: number | null | undefined) {
  if (min == null && max == null) return "não informado";
  if (min != null && max != null && min !== max) return `R$ ${min} a R$ ${max}`;
  return `R$ ${min ?? max}`;
}

function CartaoForma({ forma, destaque }: { forma: FormaDeComecar; destaque?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${destaque ? "border-gold bg-paper" : "border-line bg-paper"}`}>
      <p className="mb-2 text-[13px] font-semibold text-petrol">
        {FORMA_TIPO_LABELS[forma.tipo] ?? forma.tipo} — {forma.titulo}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="O que fazer primeiro" value={forma.oQueFazerPrimeiro} />
        <Field label="Como chegar ao primeiro cliente" value={forma.comoChegarAoPrimeiroCliente} />
        <Field
          label="Investimento inicial (estimativa)"
          value={reais(forma.investimentoInicialBrl?.min, forma.investimentoInicialBrl?.max)}
        />
        <Field label="Tempo até a primeira venda (hipótese)" value={forma.tempoAtePrimeiraVendaHipotese} />
        <Field label="O que esta etapa valida" value={forma.oQueEstaEtapaValida} />
        <Field label="Próximo passo para virar negócio" value={forma.proximoPassoParaVirarNegocio} />
      </div>
    </div>
  );
}

export default async function NegocioPage({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { codigo } = await params;
  const query = await searchParams;
  const limiteAtingido = query.erro === "limite";

  const user = await requireUser();
  const negocio = await db.pequenoNegocio.findFirst({
    where: { codigo, status: "APROVADO" },
    include: { subcategoria: true },
  });
  if (!negocio) notFound();

  const [tipo, dbUser, desbloqueios] = await Promise.all([
    getTipoAcesso(user.id),
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } }),
    db.negocioDesbloqueado.findMany({ where: { userId: user.id }, select: { negocioId: true } }),
  ]);
  const pago = tipo === "pago";
  const desbloqueado = desbloqueios.some((d) => d.negocioId === negocio.id);
  const restantes = desbloqueiosRestantes(desbloqueios.length);
  const nivel = nivelDeVisao({ pago, liberadoGratuito: negocio.liberadoGratuito, desbloqueado });
  const { basico: b, completo: c } = projetarNegocio(negocio, nivel);
  const linkCompra = montarLinkCompra(dbUser?.email ?? user.email, dbUser?.name);

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PEQUENOS NEGÓCIOS" />

      <a href="/negocios" className="mb-4 inline-block text-[13px] font-semibold text-petrol hover:underline">
        ← Todos os pequenos negócios
      </a>

      <div className="mb-6">
        <p className="mb-1.5 font-mono text-[10.5px] tracking-wide text-ink-muted uppercase">
          {CATEGORIA_LABELS[negocio.categoria]} · {negocio.subcategoria.nome}
        </p>
        <h1 className="mb-1 font-serif text-[clamp(24px,5vw,32px)] leading-[1.15] font-medium tracking-tight text-petrol">
          {b.nome}
        </h1>
        <p className="text-[15px] text-ink-muted">{b.posicionamento}</p>
      </div>

      <div className="flex flex-col gap-5">
        <section className={sectionClass}>
          <p className={eyebrowClass}>O que o cliente recebe</p>
          <p className={`${valueClass} mb-4`}>{b.oQueOClienteRecebe}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Quem compra" value={b.compradorPersona} />
            <Field label="Quando compra" value={b.gatilhoDeCompra} />
            <Field label="O que o cliente paga para resolver" value={b.clientePagaParaResolver} />
            <Field label="Como o dinheiro entra" value={b.modeloDeReceita} />
          </div>
          {b.faixaDePreco ? (
            <p className="mt-4 rounded-lg bg-paper px-3.5 py-2.5 text-[12.5px] text-ink-muted">
              <span className="font-semibold text-petrol">Referência de preço:</span>{" "}
              {reais(b.faixaDePreco.valorMinBrl, b.faixaDePreco.valorMaxBrl)} {b.faixaDePreco.unidade}.{" "}
              {b.faixaDePreco.ePrecoDeIniciante ? "" : "É um preço praticado por outros profissionais, não necessariamente o de quem está começando. "}
              Não é promessa de renda.
            </p>
          ) : null}
        </section>

        <section className={sectionClass}>
          <p className={eyebrowClass}>O que é preciso para começar</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Preparo" value={TAG_LABELS.preparo[b.tagPreparo] ?? b.tagPreparo} />
            <Field
              label="Investimento inicial"
              value={TAG_LABELS.investimentoInicial[b.tagInvestimentoInicial] ?? b.tagInvestimentoInicial}
            />
            <Field label="Onde" value={TAG_LABELS.onde[b.tagOnde] ?? b.tagOnde} />
            <Field label="Retorno" value={TAG_LABELS.retorno[b.tagRetorno] ?? b.tagRetorno} />
            <Field
              label="Horas por semana"
              value={b.horasSemanaisMin != null ? `${b.horasSemanaisMin} a ${b.horasSemanaisMax ?? b.horasSemanaisMin} h` : null}
            />
            <Field label="Quem executa" value={TAG_LABELS.quemExecuta[b.tagQuemExecuta] ?? b.tagQuemExecuta} />
            <Field label="Escala" value={TAG_LABELS.escala[b.tagEscala] ?? b.tagEscala} />
            <Field label="Cliente" value={TAG_LABELS.cliente[b.tagCliente] ?? b.tagCliente} />
            <Field label="Relação com docência" value={DOCENCIA_LABELS[b.relacaoComDocencia]} />
          </div>
          <div className="mt-3">
            <Field
              label="Habilidades que você aproveita"
              value={b.habilidadesDoProfessor.map((h) => HABILIDADE_LABELS[h] ?? h).join(", ")}
            />
          </div>
        </section>

        <section className={sectionClass}>
          <p className={eyebrowClass}>Exigências legais e de registro</p>
          <p className={valueClass}>{b.exigenciasLegais ?? "Nenhuma exigência específica informada."}</p>
          <p className="mt-2 text-[12.5px] text-ink-muted">
            {TAG_LABELS.mei[b.enquadramentoMei] ?? b.enquadramentoMei}. Confirme as regras com um contador ou
            com o órgão competente antes de vender.
          </p>
        </section>

        {b.formaDeComecar ? (
          <details className="group rounded-[var(--radius-app)] border border-gold bg-paper-raised p-5">
            <summary className="cursor-pointer font-serif text-lg font-medium tracking-tight text-petrol">
              Como começar
              <span className="ml-2 text-[13px] font-normal text-ink-muted group-open:hidden">
                — abrir a primeira forma de começar
              </span>
            </summary>
            <div className="mt-4 flex flex-col gap-4">
              <CartaoForma forma={b.formaDeComecar} destaque />
              <p className="text-[13px] text-ink-muted">
                Você pode executar esta forma de começar por conta própria, sem pagar nada à plataforma.
              </p>

              {!pago ? (
                <div className="rounded-lg border border-line bg-paper p-4">
                  <p className="mb-1.5 text-[14px] font-semibold text-petrol">
                    Quer começar com mais tranquilidade?
                  </p>
                  <p className="mb-3 text-[13.5px] leading-[1.55] text-ink-muted">
                    O plano personalizado transforma essa forma de começar num caminho semana a semana, ajustado
                    às horas que você realmente tem: tarefas com o que entregar e quando considerar concluída,
                    saídas para quando você travar e um check-in semanal para manter o ritmo. Ele não promete
                    resultado, mas tira de você o trabalho de decidir o que fazer em cada etapa.
                  </p>
                  {linkCompra ? (
                    <a
                      href={linkCompra}
                      className="inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
                    >
                      Quero o plano personalizado →
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </details>
        ) : null}

        {c ? (
          <>
            <section className={sectionClass}>
              <p className={eyebrowClass}>Como cresce e riscos</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Como cresce" value={c.comoCresce} />
                <Field label="Risco estrutural" value={c.riscoEstrutural} />
              </div>
            </section>

            <section className={sectionClass}>
              <p className={eyebrowClass}>Evidência de mercado</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Grau de evidência" value={EVIDENCIA_LABELS[c.nivelEvidencia] ?? c.nivelEvidencia} />
                <Field label="O que foi observado" value={c.sinalObservado} />
              </div>
              {c.fontes.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-1">
                  {c.fontes.map((f, i) => (
                    <li key={i} className="text-[13px] text-ink-muted">
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-petrol hover:underline">
                        {f.natureza}
                      </a>{" "}
                      — {f.afirma}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            {c.outrasFormasDeComecar.length > 0 ? (
              <section className={sectionClass}>
                <p className={eyebrowClass}>Outras formas de começar</p>
                <div className="flex flex-col gap-4">
                  {c.outrasFormasDeComecar.map((f) => (
                    <CartaoForma key={f.ordem} forma={f} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section className="rounded-[var(--radius-app)] border border-dashed border-line bg-paper p-5">
            <p className="mb-2 flex items-center gap-2 font-serif text-lg font-medium tracking-tight text-petrol">
              <Cadeado /> Visão completa
            </p>
            <p className="mb-4 text-[13.5px] text-ink-muted">
              Como o negócio cresce, os riscos de longo prazo, a evidência de mercado com as fontes e outras
              formas de começar.
            </p>
            {limiteAtingido || restantes === 0 ? (
              <>
                <p className="mb-3 text-[13.5px] text-ink">
                  Você já usou suas {LIMITE_DESBLOQUEIOS_GRATUITOS} visões completas gratuitas.
                </p>
                {linkCompra ? (
                  <a
                    href={linkCompra}
                    className="inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
                  >
                    Quero o acesso completo →
                  </a>
                ) : null}
              </>
            ) : (
              <form action={desbloquearNegocio.bind(null, negocio.codigo)} className="flex flex-wrap items-center gap-3">
                <SubmitButton
                  pendingText="Liberando..."
                  className="rounded-lg border border-petrol px-5 py-2.5 text-sm font-semibold text-petrol transition-colors hover:bg-gold-soft"
                >
                  Ver completo (restam {restantes})
                </SubmitButton>
                <span className="text-[12.5px] text-ink-muted">
                  Usa 1 das suas {LIMITE_DESBLOQUEIOS_GRATUITOS} visões completas gratuitas.
                </span>
              </form>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
