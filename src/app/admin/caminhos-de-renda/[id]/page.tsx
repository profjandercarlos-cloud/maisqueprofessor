import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SubmitButton } from "@/components/submit-button";
import { revisarCaminho, ajustarComIA } from "../actions";

// Chamada de IA do "Ajustar com IA" — leve (1 registro), mas segue o mesmo
// teto generoso do resto do motor por segurança.
export const maxDuration = 60;

const STATUS_LABELS: Record<string, string> = {
  PENDENTE_REVISAO: "Pendente de revisão",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
};

const FORCA_EVIDENCIA_LABELS: Record<string, string> = {
  OFERTA_PUBLICADA: "Oferta publicada",
  PEDIDO_DOCUMENTADO: "Pedido documentado",
  SELECAO_CONCLUIDA: "Seleção concluída",
  CONTRATO_COM_VALOR: "Contrato com valor",
  PILOTO_PAGO_DO_PROFESSOR: "Piloto pago pelo professor",
};

const RELACAO_DOCENCIA_LABELS: Record<string, string> = {
  ENSINO_FORA_DA_ESCOLA: "Ensino fora da escola",
  EDUCACAO_SEM_AULA: "Educação, sem dar aula",
  OUTRO_SETOR: "Outro setor",
};

const sectionClass = "rounded-[var(--radius-app)] border border-line bg-paper-raised p-5";
const labelClass = "mb-0.5 text-[12px] font-semibold text-petrol";
const valueClass = "text-[13.5px] leading-[1.5] text-ink";

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value ?? "—"}</p>
    </div>
  );
}

export default async function CaminhoRendaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const caminho = await db.caminhoRenda.findUnique({ where: { id } });
  if (!caminho) notFound();

  const returnTo = `/admin/caminhos-de-renda/${id}`;
  const fontes = Array.isArray(caminho.fontes) ? (caminho.fontes as { url: string; natureza: string; afirma: string }[]) : [];
  const preco = caminho.precoReferenciaExterna as { valorBrl: number; unidade: string; escopoComparavel: boolean; fonte: string } | null;

  return (
    <div className="flex flex-col gap-6">
      <a href="/admin/caminhos-de-renda" className="text-[13px] font-semibold text-petrol hover:underline">
        ← Todos os Caminhos de Renda
      </a>

      {error ? (
        <p className="rounded-lg border border-role-3 bg-paper px-4 py-2.5 text-[13.5px] text-role-3">{error}</p>
      ) : null}

      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-badge-bg px-2.5 py-[3px] font-mono text-[10.5px] tracking-wide text-badge-text uppercase">
            {STATUS_LABELS[caminho.status]}
          </span>
        </div>
        <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">{caminho.titulo}</h1>
        <p className="text-[14px] text-ink-muted">{caminho.posicionamento}</p>
      </div>

      <section className={sectionClass}>
        <p className="mb-3 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">Evidência de mercado</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Segmento comprador" value={caminho.compradorSegmento} />
          <Field label="Força de evidência" value={FORCA_EVIDENCIA_LABELS[caminho.forcaEvidencia] ?? caminho.forcaEvidencia} />
          <Field label="Persona compradora" value={caminho.compradorPersona} />
          <Field label="Gatilho" value={caminho.gatilho} />
          <Field label="Categoria de mercado" value={caminho.categoriaMercado} />
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
        <p className="mb-3 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">Adequação de execução</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Capacidade a verificar" value={caminho.capacidadeAVerificar} />
          <Field label="Relação com docência" value={RELACAO_DOCENCIA_LABELS[caminho.relacaoComDocencia] ?? caminho.relacaoComDocencia} />
          <Field label="Restrições" value={caminho.restricoes} />
        </div>
      </section>

      <section className={sectionClass}>
        <p className="mb-3 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">Oferta e crescimento</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Primeira entrega vendável" value={caminho.primeiraEntregaVendavel} />
          <Field label="Canal de acesso" value={caminho.canalDeAcesso} />
          <Field label="Modelo de receita" value={caminho.modeloDeReceita} />
          <Field label="Como cresce" value={caminho.comoCresce} />
          <Field label="Risco estrutural" value={caminho.riscoEstrutural} />
        </div>
      </section>

      <section className={sectionClass}>
        <p className="mb-3 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
          Economia (honestamente incompleta — nunca prometida ao professor)
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Preço de referência externa"
            value={preco ? `R$ ${preco.valorBrl} ${preco.unidade} (${preco.fonte})` : null}
          />
          <Field label="Preço do primeiro contrato real" value={caminho.precoPrimeiroContratoReal} />
          <Field label="Horas reais por entrega" value={caminho.horasReaisPorEntrega} />
          <Field label="Renda mensal líquida observada" value={caminho.rendaMensalLiquidaObservada} />
        </div>
      </section>

      <section className={sectionClass}>
        <p className="mb-3 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">Tags de scoring (uso futuro)</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Habilidade nuclear" value={caminho.habilidadeNuclear} />
          <Field label="Modalidade" value={caminho.modalidade} />
          <Field label="Capital" value={caminho.capital} />
          <Field label="Mecanismo de renda" value={caminho.mecanismoRenda} />
          <Field label="Investigável no diagnóstico" value={caminho.investigavelNoDiagnostico ? "Sim" : "Não"} />
          <Field label="Grupo de ofertas semelhantes" value={caminho.grupoDeOfertasSemelhantes} />
        </div>
      </section>

      <section className={sectionClass}>
        <p className="mb-3 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">Auditoria</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Principal lacuna" value={caminho.principalLacuna} />
          <Field label="Teste piloto necessário" value={caminho.testePilotoNecessario} />
        </div>
      </section>

      {caminho.notaRevisao ? (
        <div className="rounded-lg border border-gold-soft bg-gold-soft px-4 py-3 text-[13.5px] text-ink">
          <p className="mb-0.5 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">Última nota de revisão</p>
          {caminho.notaRevisao}
        </div>
      ) : null}

      <section className={sectionClass}>
        <p className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">Revisão</p>
        <form className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[13.5px]">
            <span className="font-semibold text-petrol">
              Nota (motivo ao rejeitar/deixar pendente, ou o que ajustar com IA)
            </span>
            <textarea
              name="nota"
              rows={3}
              defaultValue={caminho.notaRevisao ?? ""}
              className="rounded-md border border-line px-3 py-2 text-[13.5px]"
            />
          </label>
          <div className="flex flex-wrap gap-2.5">
            <SubmitButton
              pendingText="Aprovando..."
              formAction={revisarCaminho.bind(null, returnTo, id, "APROVADO")}
              className="rounded-lg bg-gold px-4 py-2 text-[13.5px] font-semibold text-paper hover:opacity-90"
            >
              Aprovar
            </SubmitButton>
            <SubmitButton
              pendingText="Salvando..."
              formAction={revisarCaminho.bind(null, returnTo, id, "PENDENTE_REVISAO")}
              className="rounded-lg border border-line px-4 py-2 text-[13.5px] font-semibold text-ink hover:border-petrol hover:text-petrol"
            >
              Deixar pendente
            </SubmitButton>
            <SubmitButton
              pendingText="Rejeitando..."
              formAction={revisarCaminho.bind(null, returnTo, id, "REJEITADO")}
              className="rounded-lg border border-role-3 px-4 py-2 text-[13.5px] font-semibold text-role-3 hover:bg-paper"
            >
              Rejeitar
            </SubmitButton>
            <SubmitButton
              pendingText="Ajustando com IA..."
              formAction={ajustarComIA.bind(null, returnTo, id)}
              className="ml-auto rounded-lg border border-petrol px-4 py-2 text-[13.5px] font-semibold text-petrol hover:bg-gold-soft"
            >
              Ajustar com IA →
            </SubmitButton>
          </div>
        </form>
      </section>
    </div>
  );
}
