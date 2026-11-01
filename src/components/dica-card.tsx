import type { DicaReacaoTipo } from "@/generated/prisma/client";
import { reagirAction } from "@/app/lista-de-presenca/actions";
import { SubmitButton } from "@/components/submit-button";
import { nomeDaCategoria } from "@/lib/dicas/categorias";

export const REACOES: { tipo: DicaReacaoTipo; rotulo: string; rotuloMarcado: string }[] = [
  { tipo: "GUARDADA", rotulo: "Faz sentido, guardar", rotuloMarcado: "Guardada no seu caderno" },
  { tipo: "JA_FACO", rotulo: "Já faço isso", rotuloMarcado: "Você já faz isso" },
  { tipo: "NAO_E_PARA_MIM", rotulo: "Não é para mim", rotuloMarcado: "Marcada como não é para você" },
];

type DicaParaCartao = {
  id: string;
  categoria: string;
  titulo: string;
  texto: string;
  tenteHoje: string;
  ideia: string | null;
  revisita?: boolean;
  reacao: DicaReacaoTipo | null;
};

// Os 3 botões de reação. Clicar na reação já marcada a desfaz. Cada um é um formulário que volta
// para `voltar` depois de gravar, então funciona sem JavaScript no navegador.
export function BotoesDeReacao({ dicaId, atual, voltar }: { dicaId: string; atual: DicaReacaoTipo | null; voltar: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {REACOES.map((r) => {
        const marcada = atual === r.tipo;
        return (
          <form key={r.tipo} action={reagirAction.bind(null, dicaId, r.tipo, voltar)}>
            <SubmitButton
              pendingText="..."
              className={`rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                marcada
                  ? "border-petrol bg-petrol text-paper"
                  : "border-line bg-paper text-petrol hover:border-petrol hover:bg-gold-soft"
              }`}
            >
              {marcada ? `✓ ${r.rotuloMarcado}` : r.rotulo}
            </SubmitButton>
          </form>
        );
      })}
    </div>
  );
}

// A dica do dia: reconhece uma situação, explica a ideia e propõe uma ação para hoje.
export function DicaCard({ dica, voltar }: { dica: DicaParaCartao; voltar: string }) {
  return (
    <article className="rounded-[var(--radius-app)] border border-gold bg-paper-raised p-5 shadow-[var(--shadow)]">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-gold uppercase">Dica do dia</span>
        <span className="rounded-full bg-gold-soft px-2.5 py-[2px] text-[11px] font-medium text-petrol">
          {nomeDaCategoria(dica.categoria)}
        </span>
        {dica.revisita ? (
          <span className="rounded-full border border-line px-2.5 py-[2px] text-[11px] text-ink-muted">
            Você já viu esta, vale rever
          </span>
        ) : null}
      </div>

      <h2 className="mb-2 font-serif text-[21px] leading-[1.2] font-medium tracking-tight text-petrol">{dica.titulo}</h2>
      <p className="mb-4 text-[15px] leading-[1.65] text-ink">{dica.texto}</p>

      <div className="mb-4 rounded-lg bg-gold-soft px-4 py-3">
        <p className="mb-0.5 font-mono text-[10px] tracking-[0.08em] text-gold uppercase">Tente hoje</p>
        <p className="text-[14.5px] leading-[1.55] text-ink">{dica.tenteHoje}</p>
      </div>

      {dica.ideia ? <p className="mb-4 text-[12px] text-ink-muted italic">Ideia: {dica.ideia}</p> : null}

      <BotoesDeReacao dicaId={dica.id} atual={dica.reacao} voltar={voltar} />
    </article>
  );
}
