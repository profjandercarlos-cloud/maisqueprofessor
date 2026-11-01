import { AppHeader } from "@/components/app-header";
import { BotoesDeReacao } from "@/components/dica-card";
import { CalendarioDePresenca } from "@/components/calendario-de-presenca";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { nomeDaCategoria } from "@/lib/dicas/categorias";
import { lerMes } from "@/lib/presenca/calendario";
import { diaLocal } from "@/lib/presenca/dias";
import { diasDePresenca } from "@/lib/presenca/servico";
import type { DicaReacaoTipo } from "@/generated/prisma/client";
import { marcarPresencaAction, salvarNotaAction } from "./actions";

const ABAS = [
  { id: "guardadas", rotulo: "Guardadas", tipo: "GUARDADA" as DicaReacaoTipo },
  { id: "ja-faco", rotulo: "Já faço isso", tipo: "JA_FACO" as DicaReacaoTipo },
  { id: "nao-e-para-mim", rotulo: "Não é para mim", tipo: "NAO_E_PARA_MIM" as DicaReacaoTipo },
  { id: "sem-resposta", rotulo: "Sem resposta", tipo: null },
] as const;

type ItemDeDica = {
  id: string;
  categoria: string;
  titulo: string;
  texto: string;
  tenteHoje: string;
  ideia: string | null;
  reacao: DicaReacaoTipo | null;
  nota: string | null;
};

const VAZIO: Record<string, string> = {
  guardadas: "Quando uma dica fizer sentido, toque em “Faz sentido, guardar” e ela fica aqui para você rever quando precisar.",
  "ja-faco": "As dicas que você já pratica ficam aqui. Se começar a fazer uma que estava em outra aba, mude por aqui.",
  "nao-e-para-mim": "As dicas que não combinam com você ficam aqui, fora do seu caminho. Você pode mudar de ideia quando quiser.",
  "sem-resposta": "Todas as dicas que você recebeu já têm uma resposta sua.",
};

export default async function ListaDePresencaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const user = await requireActiveAccess();

  const hoje = diaLocal(new Date());
  const dias = await diasDePresenca(user.id);
  const presentes = new Set(dias);
  const mes = lerMes(typeof query.mes === "string" ? query.mes : undefined, hoje);
  const abaId = ABAS.some((a) => a.id === query.aba) ? (query.aba as string) : "guardadas";

  const [reacoes, recebidas] = await Promise.all([
    db.dicaReacao.findMany({ where: { userId: user.id }, include: { dica: true }, orderBy: { updatedAt: "desc" } }),
    db.presenca.findMany({
      where: { userId: user.id, dicaId: { not: null } },
      include: { dica: true },
      orderBy: { dia: "desc" },
    }),
  ]);

  const comReacao = new Set(reacoes.map((r) => r.dicaId));
  const porAba: Record<string, ItemDeDica[]> = { guardadas: [], "ja-faco": [], "nao-e-para-mim": [], "sem-resposta": [] };
  const paraItem = (d: NonNullable<(typeof recebidas)[number]["dica"]>, reacao: DicaReacaoTipo | null, nota: string | null): ItemDeDica => ({
    id: d.id,
    categoria: d.categoria,
    titulo: d.titulo,
    texto: d.texto,
    tenteHoje: d.tenteHoje,
    ideia: d.ideia,
    reacao,
    nota,
  });
  for (const r of reacoes) {
    const chave = ABAS.find((a) => a.tipo === r.tipo)!.id;
    porAba[chave].push(paraItem(r.dica, r.tipo, r.nota));
  }
  const jaListadas = new Set<string>();
  for (const p of recebidas) {
    if (!p.dica || comReacao.has(p.dica.id) || jaListadas.has(p.dica.id)) continue;
    jaListadas.add(p.dica.id);
    porAba["sem-resposta"].push(paraItem(p.dica, null, null));
  }

  const itens = porAba[abaId];
  const presenteHoje = presentes.has(hoje);
  const parametros = { aba: abaId, mes: `${mes.ano}-${String(mes.mes).padStart(2, "0")}` };
  const voltar = `/lista-de-presenca?${new URLSearchParams(parametros).toString()}`;

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="LISTA DE PRESENÇA" />

      <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">Lista de presença</h1>
      <p className="mb-2 font-serif text-[20px] font-medium text-ink">
        {dias.length} {dias.length === 1 ? "dia" : "dias"} com você
      </p>
      <p className="mb-7 max-w-[58ch] text-[14px] leading-[1.6] text-ink-muted">
        Cada Presente é um dia em que você se comprometeu a executar o seu plano. O contador nunca zera: ele só cresce.
        Abrir o app sem marcar presença não conta.
      </p>

      {!presenteHoje ? (
        <form
          action={marcarPresencaAction}
          className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-app)] border border-gold bg-gold-soft px-4 py-3"
        >
          <p className="text-[14px] text-ink">Hoje você ainda não marcou presença.</p>
          <SubmitButton
            pendingText="Registrando..."
            className="rounded-lg bg-gold px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:opacity-90"
          >
            Presente: vou executar hoje
          </SubmitButton>
        </form>
      ) : null}

      <div className="mb-10 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
        <CalendarioDePresenca
          ano={mes.ano}
          mes={mes.mes}
          presentes={presentes}
          hoje={hoje}
          caminho="/lista-de-presenca"
          parametros={{ aba: abaId }}
        />
      </div>

      <h2 className="mb-1 font-serif text-xl font-medium tracking-tight text-petrol">Suas dicas</h2>
      <p className="mb-4 text-[13.5px] text-ink-muted">
        Todas as dicas que você recebeu, separadas pelo que você respondeu. Dá para mudar a resposta a qualquer momento.
      </p>

      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Abas das dicas">
        {ABAS.map((a) => {
          const ativa = a.id === abaId;
          const q = new URLSearchParams({ aba: a.id, mes: parametros.mes });
          return (
            <a
              key={a.id}
              href={`/lista-de-presenca?${q.toString()}`}
              aria-current={ativa ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                ativa ? "border-petrol bg-petrol text-paper" : "border-line text-ink hover:border-petrol hover:text-petrol"
              }`}
            >
              {a.rotulo} ({porAba[a.id].length})
            </a>
          );
        })}
      </nav>

      {itens.length === 0 ? (
        <p className="rounded-[var(--radius-app)] border border-dashed border-line bg-paper-raised p-5 text-[14px] text-ink-muted">
          {recebidas.length === 0 && reacoes.length === 0
            ? "As dicas que você receber ao marcar presença aparecem aqui."
            : VAZIO[abaId]}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {itens.map((d) => (
            <li key={d.id}>
              <details className="group rounded-[var(--radius-app)] border border-line bg-paper-raised">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4">
                  <span>
                    <span className="mb-0.5 block font-mono text-[10px] tracking-[0.08em] text-gold uppercase">
                      {nomeDaCategoria(d.categoria)}
                    </span>
                    <span className="block font-serif text-[17px] font-medium text-ink">{d.titulo}</span>
                  </span>
                  <span className="mt-1 shrink-0 text-[13px] font-semibold text-petrol group-open:hidden">Abrir</span>
                  <span className="mt-1 hidden shrink-0 text-[13px] font-semibold text-petrol group-open:inline">Fechar</span>
                </summary>
                <div className="border-t border-line px-4 pt-3 pb-4">
                  <p className="mb-3 text-[14.5px] leading-[1.65] text-ink">{d.texto}</p>
                  <div className="mb-3 rounded-lg bg-gold-soft px-3.5 py-2.5">
                    <p className="mb-0.5 font-mono text-[10px] tracking-[0.08em] text-gold uppercase">Tente hoje</p>
                    <p className="text-[14px] leading-[1.55] text-ink">{d.tenteHoje}</p>
                  </div>
                  {d.ideia ? <p className="mb-3 text-[12px] text-ink-muted italic">Ideia: {d.ideia}</p> : null}

                  {d.reacao === "GUARDADA" ? (
                    <form action={salvarNotaAction.bind(null, d.id, voltar)} className="mb-3">
                      <label htmlFor={`nota-${d.id}`} className="mb-1 block text-[12.5px] font-medium text-ink">
                        Como eu vou aplicar (opcional)
                      </label>
                      <textarea
                        id={`nota-${d.id}`}
                        name="nota"
                        defaultValue={d.nota ?? ""}
                        maxLength={1000}
                        placeholder="Escreva com as suas palavras..."
                        className="mb-2 min-h-[64px] w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-[14px] text-ink outline-none focus:border-petrol"
                      />
                      <SubmitButton
                        pendingText="Salvando..."
                        className="rounded-lg border border-petrol px-3.5 py-1.5 text-[12.5px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
                      >
                        Salvar anotação
                      </SubmitButton>
                    </form>
                  ) : null}

                  <BotoesDeReacao dicaId={d.id} atual={d.reacao} voltar={voltar} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
