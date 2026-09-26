import { db } from "@/lib/db";
import type { CaminhoRendaStatus } from "@/generated/prisma/client";

const STATUS_LABELS: Record<CaminhoRendaStatus, string> = {
  PENDENTE_REVISAO: "Pendente",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
};

const STATUS_ROW_COLORS: Record<CaminhoRendaStatus, string> = {
  PENDENTE_REVISAO: "border-yellow-300 bg-yellow-50",
  APROVADO: "border-green-300 bg-green-50",
  REJEITADO: "border-red-300 bg-red-50",
};

const STATUS_BADGE_COLORS: Record<CaminhoRendaStatus, string> = {
  PENDENTE_REVISAO: "bg-yellow-200 text-yellow-900",
  APROVADO: "bg-green-200 text-green-900",
  REJEITADO: "bg-red-200 text-red-900",
};

const STATUS_FILTER_MAP: Record<string, CaminhoRendaStatus> = {
  pendente: "PENDENTE_REVISAO",
  aprovado: "APROVADO",
  rejeitado: "REJEITADO",
};

const FORCA_EVIDENCIA_LABELS: Record<string, string> = {
  OFERTA_PUBLICADA: "Oferta publicada",
  PEDIDO_DOCUMENTADO: "Pedido documentado",
  SELECAO_CONCLUIDA: "Seleção concluída",
  CONTRATO_COM_VALOR: "Contrato com valor",
  PILOTO_PAGO_DO_PROFESSOR: "Piloto pago pelo professor",
};

export default async function CaminhosDeRendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const statusParam = typeof query.status === "string" ? query.status : undefined;
  const status = statusParam ? STATUS_FILTER_MAP[statusParam] : undefined;

  const [caminhos, counts] = await Promise.all([
    db.caminhoRenda.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "asc" },
    }),
    db.caminhoRenda.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<
    CaminhoRendaStatus,
    number
  >;
  const total = Object.values(countByStatus).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">Caminhos de Renda</h1>
      <p className="mb-6 max-w-[65ch] text-[13.5px] text-ink-muted">
        Repositório interno de atividades paralelas de renda pesquisadas — revise, aprove, rejeite ou peça um
        ajuste por IA antes de qualquer uso pelo produto.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href="/admin/caminhos-de-renda"
          className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
            !status ? "border-petrol text-petrol" : "border-line text-ink hover:border-petrol"
          }`}
        >
          Todos ({total})
        </a>
        {(Object.keys(STATUS_FILTER_MAP) as (keyof typeof STATUS_FILTER_MAP)[]).map((key) => (
          <a
            key={key}
            href={`/admin/caminhos-de-renda?status=${key}`}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              statusParam === key ? "border-petrol text-petrol" : "border-line text-ink hover:border-petrol"
            }`}
          >
            {STATUS_LABELS[STATUS_FILTER_MAP[key]]} ({countByStatus[STATUS_FILTER_MAP[key]] ?? 0})
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {caminhos.map((c) => (
          <a
            key={c.id}
            href={`/admin/caminhos-de-renda/${c.id}`}
            className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-[13.5px] transition-colors hover:border-petrol ${STATUS_ROW_COLORS[c.status]}`}
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium text-ink">{c.titulo}</span>
              <span className="text-[12px] text-ink-muted">
                {c.compradorSegmento} · {FORCA_EVIDENCIA_LABELS[c.forcaEvidencia] ?? c.forcaEvidencia}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-[3px] font-mono text-[10.5px] tracking-wide uppercase ${STATUS_BADGE_COLORS[c.status]}`}
            >
              {STATUS_LABELS[c.status]}
            </span>
          </a>
        ))}
        {caminhos.length === 0 ? (
          <p className="text-[13.5px] text-ink-muted">Nenhum caminho de renda nesse filtro.</p>
        ) : null}
      </div>
    </div>
  );
}
