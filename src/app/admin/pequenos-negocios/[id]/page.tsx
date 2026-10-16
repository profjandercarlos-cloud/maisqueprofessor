import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SubmitButton } from "@/components/submit-button";
import { FichaProfessorView } from "@/components/ficha-professor";
import { lerFicha, numerosDaFicha } from "@/lib/negocios/ficha";
import { gerarFichaNegocio, revisarNegocio } from "../actions";

// Gerar a ficha chama a IA (dezenas de segundos até ~1 min).
export const maxDuration = 300;
import {
  CATEGORIA_LABELS,
  EVIDENCIA_LABELS,
  FORMA_TIPO_LABELS,
  HABILIDADE_LABELS,
  TAG_LABELS,
} from "@/lib/negocios/tags";

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

const DOCENCIA_LABELS: Record<string, string> = {
  ENSINO_FORA_DA_ESCOLA: "Ensino fora da escola",
  EDUCACAO_SEM_AULA: "Educação, sem dar aula",
  OUTRO_SETOR: "Outro setor",
};

const sectionClass = "rounded-[var(--radius-app)] border border-line bg-paper-raised p-5";
const labelClass = "mb-0.5 text-[12px] font-semibold text-petrol";
const valueClass = "text-[13.5px] leading-[1.5] text-ink";
const eyebrowClass = "mb-3 font-mono text-[10px] tracking-[0.06em] text-gold uppercase";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value ?? "—"}</p>
    </div>
  );
}

type Fonte = { url: string; natureza: string; afirma: string; paginaAbertaNestaRodada?: boolean };
type Forma = {
  ordem: number;
  tipo: string;
  titulo: string;
  oQueFazerPrimeiro: string;
  comoChegarAoPrimeiroCliente: string;
  investimentoInicialBrl: { min: number | null; max: number | null } | null;
  tempoAtePrimeiraVendaHipotese: string;
  oQueEstaEtapaValida: string;
  proximoPassoParaVirarNegocio: string;
};
type Preco = {
  valorMinBrl: number | null;
  valorMaxBrl: number | null;
  unidade: string;
  tipo: string;
  fonteOuBase: string;
  ePrecoDeIniciante: boolean;
};

function faixa(min: number | null | undefined, max: number | null | undefined) {
  if (min == null && max == null) return "não informado";
  if (min != null && max != null) return `R$ ${min} a R$ ${max}`;
  return `R$ ${min ?? max}`;
}

export default async function PequenoNegocioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const n = await db.pequenoNegocio.findUnique({ where: { id }, include: { subcategoria: true } });
  if (!n) notFound();

  const returnTo = `/admin/pequenos-negocios/${id}`;
  const ficha = lerFicha(n.ficha);
  const fontes = (Array.isArray(n.fontes) ? n.fontes : []) as Fonte[];
  const formas = (Array.isArray(n.formasDeComecar) ? n.formasDeComecar : []) as Forma[];
  const preco = n.faixaDePreco as Preco | null;

  return (
    <div className="flex flex-col gap-6">
      <a href="/admin/pequenos-negocios" className="text-[13px] font-semibold text-petrol hover:underline">
        ← Todos os Pequenos Negócios
      </a>

      {error ? (
        <p className="rounded-lg border border-role-3 bg-paper px-4 py-2.5 text-[13.5px] text-role-3">{error}</p>
      ) : null}

      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
          <span
            className={`rounded-full px-2.5 py-[3px] font-mono text-[10.5px] tracking-wide uppercase ${STATUS_BADGE_COLORS[n.status]}`}
          >
            {STATUS_LABELS[n.status]}
          </span>
          <span className="font-mono text-[10.5px] tracking-wide text-ink-muted uppercase">
            {CATEGORIA_LABELS[n.categoria]} · {n.subcategoria.nome} · {n.codigo}
          </span>
        </div>
        <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">{n.nome}</h1>
        <p className="text-[14px] text-ink-muted">{n.posicionamento}</p>
      </div>

      {n.fontesCompartilhadas ? (
        <p className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-[13px] text-yellow-900">
          Atenção: todas as fontes deste negócio também sustentam outro negócio. A evidência é menos independente.
        </p>
      ) : null}

      <section className={sectionClass}>
        <p className={eyebrowClass}>Três formas de começar</p>
        <div className="flex flex-col gap-4">
          {formas.map((f) => (
            <div key={f.ordem} className="rounded-lg border border-line bg-paper p-4">
              <p className="mb-2 text-[13px] font-semibold text-petrol">
                {f.ordem}. {FORMA_TIPO_LABELS[f.tipo] ?? f.tipo} — {f.titulo}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="O que fazer primeiro" value={f.oQueFazerPrimeiro} />
                <Field label="Como chegar ao primeiro cliente" value={f.comoChegarAoPrimeiroCliente} />
                <Field
                  label="Investimento inicial (estimativa)"
                  value={faixa(f.investimentoInicialBrl?.min, f.investimentoInicialBrl?.max)}
                />
                <Field label="Tempo até a primeira venda (hipótese)" value={f.tempoAtePrimeiraVendaHipotese} />
                <Field label="O que esta etapa valida" value={f.oQueEstaEtapaValida} />
                <Field label="Próximo passo para virar negócio" value={f.proximoPassoParaVirarNegocio} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <p className={eyebrowClass}>Demanda e percepção de valor</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="O que o cliente recebe" value={n.oQueOClienteRecebe} />
          <Field label="Grau de evidência" value={EVIDENCIA_LABELS[n.nivelEvidencia]} />
          <Field label="Segmento comprador" value={n.compradorSegmento} />
          <Field label="Persona compradora" value={n.compradorPersona} />
          <Field label="Gatilho de compra" value={n.gatilhoDeCompra} />
          <Field label="O que o cliente paga para resolver" value={n.clientePagaParaResolver} />
          <Field label="Sinal observado" value={n.sinalObservado} />
        </div>
        {fontes.length > 0 ? (
          <div className="mt-3">
            <p className={labelClass}>Fontes</p>
            <ul className="flex flex-col gap-1">
              {fontes.map((f, i) => (
                <li key={i} className="text-[13px] text-ink-muted">
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-petrol hover:underline">
                    {f.natureza}
                  </a>{" "}
                  — {f.afirma}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className={sectionClass}>
        <p className={eyebrowClass}>Negócio e crescimento</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Modelo de receita" value={n.modeloDeReceita} />
          <Field
            label="Faixa de preço observada (referência externa)"
            value={
              preco && (preco.valorMinBrl != null || preco.valorMaxBrl != null)
                ? `${faixa(preco.valorMinBrl, preco.valorMaxBrl)} ${preco.unidade}${preco.ePrecoDeIniciante ? "" : " (não é preço de iniciante)"}`
                : "não apurada"
            }
          />
          <Field label="Como cresce" value={n.comoCresce} />
          <Field label="Risco estrutural" value={n.riscoEstrutural} />
          <Field label="Exigências legais ou de registro" value={n.exigenciasLegais} />
        </div>
      </section>

      <section className={sectionClass}>
        <p className={eyebrowClass}>Etiquetas</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Onde" value={TAG_LABELS.onde[n.tagOnde] ?? n.tagOnde} />
          <Field label="Quem executa" value={TAG_LABELS.quemExecuta[n.tagQuemExecuta] ?? n.tagQuemExecuta} />
          <Field label="Preparo" value={TAG_LABELS.preparo[n.tagPreparo] ?? n.tagPreparo} />
          <Field label="Investimento inicial" value={TAG_LABELS.investimentoInicial[n.tagInvestimentoInicial] ?? n.tagInvestimentoInicial} />
          <Field label="Escala" value={TAG_LABELS.escala[n.tagEscala] ?? n.tagEscala} />
          <Field label="Retorno" value={TAG_LABELS.retorno[n.tagRetorno] ?? n.tagRetorno} />
          <Field label="Receita" value={TAG_LABELS.receita[n.tagReceita] ?? n.tagReceita} />
          <Field label="Cliente" value={TAG_LABELS.cliente[n.tagCliente] ?? n.tagCliente} />
          <Field label="Relação com docência" value={DOCENCIA_LABELS[n.relacaoComDocencia]} />
          <Field label="MEI" value={TAG_LABELS.mei[n.enquadramentoMei] ?? n.enquadramentoMei} />
          <Field
            label="Habilidades do professor"
            value={n.habilidadesDoProfessor.map((h) => HABILIDADE_LABELS[h] ?? h).join(", ")}
          />
          <Field
            label="Horas por semana para começar"
            value={n.horasSemanaisMin != null ? `${n.horasSemanaisMin} a ${n.horasSemanaisMax ?? n.horasSemanaisMin} h` : null}
          />
          <Field label="Grupo de negócios semelhantes" value={n.grupoSemelhante} />
        </div>
      </section>

      {n.principalLacuna || n.testePilotoNecessario ? (
        <section className={sectionClass}>
          <p className={eyebrowClass}>Auditoria</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Principal lacuna" value={n.principalLacuna} />
            <Field label="Teste piloto necessário" value={n.testePilotoNecessario} />
          </div>
        </section>
      ) : null}

      {n.notaRevisao ? (
        <div className="rounded-lg border border-gold-soft bg-gold-soft px-4 py-3 text-[13.5px] text-ink">
          <p className="mb-0.5 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">Última nota de revisão</p>
          {n.notaRevisao}
        </div>
      ) : null}

      <section className={sectionClass}>
        <p className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">Revisão</p>
        <form className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[13.5px]">
            <span className="font-semibold text-petrol">Nota (motivo ao rejeitar ou deixar pendente)</span>
            <textarea
              name="nota"
              rows={3}
              defaultValue={n.notaRevisao ?? ""}
              className="rounded-md border border-line px-3 py-2 text-[13.5px]"
            />
          </label>
          <div className="flex flex-wrap gap-2.5">
            <SubmitButton
              pendingText="Aprovando..."
              formAction={revisarNegocio.bind(null, returnTo, id, "APROVADO")}
              className="rounded-lg bg-gold px-4 py-2 text-[13.5px] font-semibold text-paper hover:opacity-90"
            >
              Aprovar
            </SubmitButton>
            <SubmitButton
              pendingText="Salvando..."
              formAction={revisarNegocio.bind(null, returnTo, id, "PENDENTE_REVISAO")}
              className="rounded-lg border border-line px-4 py-2 text-[13.5px] font-semibold text-ink hover:border-petrol hover:text-petrol"
            >
              Deixar pendente
            </SubmitButton>
            <SubmitButton
              pendingText="Rejeitando..."
              formAction={revisarNegocio.bind(null, returnTo, id, "REJEITADO")}
              className="rounded-lg border border-role-3 px-4 py-2 text-[13.5px] font-semibold text-role-3 hover:bg-paper"
            >
              Rejeitar
            </SubmitButton>
          </div>
        </form>
      </section>

      <section className={sectionClass}>
        <p className="mb-1 font-serif text-lg font-medium tracking-tight text-petrol">Ficha do professor</p>
        <p className="mb-3 text-[13.5px] text-ink-muted">
          É o que o usuário lê. O negócio só aparece para os usuários quando está aprovado e tem ficha.
          {ficha ? "" : " Ainda não há ficha: gere uma abaixo."}
        </p>
        <form className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[13.5px]">
            <span className="font-semibold text-petrol">
              Observação para a IA {ficha ? "(obrigatória para ajustar; opcional para regenerar)" : "(opcional)"}
            </span>
            <textarea
              name="observacao"
              rows={2}
              placeholder="Ex.: o preço sugerido está alto; destaque o risco X nos cuidados."
              className="rounded-md border border-line px-3 py-2 text-[13.5px]"
            />
          </label>
          <div className="flex flex-wrap gap-2.5">
            {ficha ? (
              <SubmitButton
                pendingText="Ajustando ficha (até 1 minuto)..."
                formAction={gerarFichaNegocio.bind(null, returnTo, id, "ajustar")}
                className="rounded-lg bg-gold px-4 py-2 text-[13.5px] font-semibold text-paper hover:opacity-90"
              >
                Ajustar ficha (mantém o resto)
              </SubmitButton>
            ) : null}
            <SubmitButton
              pendingText="Gerando ficha (até 1 minuto)..."
              formAction={gerarFichaNegocio.bind(null, returnTo, id, "regenerar")}
              className="rounded-lg border border-petrol px-4 py-2 text-[13.5px] font-semibold text-petrol hover:bg-gold-soft"
            >
              {ficha ? "Regenerar do zero" : "Gerar ficha"}
            </SubmitButton>
          </div>
          {ficha ? (
            <p className="text-[12.5px] text-ink-muted">
              <b>Ajustar</b> muda só o que a observação pede e preserva o texto que você já revisou.{" "}
              <b>Regenerar do zero</b> escreve a ficha inteira de novo e descarta a atual.
            </p>
          ) : null}
        </form>
      </section>

      {ficha ? (
        <section>
          <p className="mb-3 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">
            Prévia: como o professor vê esta ficha
          </p>
          <FichaProfessorView ficha={ficha} numeros={numerosDaFicha(n)} />
        </section>
      ) : null}
    </div>
  );
}
