import { SubmitButton } from "@/components/submit-button";
import { CalendarioDePresenca } from "@/components/calendario-de-presenca";
import { adiarPresencaAction, marcarPresencaAction } from "@/app/lista-de-presenca/actions";
import { NOMES_DOS_MESES } from "@/lib/presenca/calendario";
import { diaParaData } from "@/lib/presenca/dias";
import type { ContextoDaPessoa } from "@/lib/presenca/contexto";

const DIAS_POR_EXTENSO = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

// A chamada do dia: aparece na primeira abertura do dia pelo Painel. A pessoa é recebida pelo nome,
// vê o plano que está executando e responde "Presente" (compromisso de executar) ou "Só passei por aqui".
export function ChamadaDoDia({
  contexto,
  total,
  presentes,
  hoje,
  mes,
}: {
  contexto: ContextoDaPessoa;
  total: number;
  presentes: Set<string>;
  hoje: string;
  mes: { ano: number; mes: number };
}) {
  const data = diaParaData(hoje);
  const diaDaSemana = DIAS_POR_EXTENSO[data.getUTCDay()];
  const nome = contexto.nome?.split(/\s+/)[0] ?? null;

  return (
    <div>
      <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Lista de presença
      </span>
      <h1 className="mb-2 font-serif text-[clamp(28px,5vw,38px)] leading-[1.15] font-medium tracking-tight text-petrol">
        {nome ? `Olá, ${nome}.` : "Olá."}
      </h1>
      <p className="mb-6 text-[15px] text-ink-muted">
        Hoje é {diaDaSemana}, {data.getUTCDate()} de {NOMES_DOS_MESES[data.getUTCMonth()]}.
      </p>

      {contexto.plano ? (
        <div className="mb-7 rounded-[var(--radius-app)] border border-line bg-paper-raised p-4">
          <p className="mb-1 font-mono text-[10px] tracking-[0.08em] text-gold uppercase">O plano que você está executando</p>
          <p className="font-serif text-[18px] font-medium text-ink">{contexto.plano.titulo}</p>
          {contexto.proximaAcao ? (
            <p className="mt-1 text-[14px] text-ink-muted">
              Próxima ação: <span className="font-semibold text-ink">{contexto.proximaAcao}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mb-3 font-serif text-[19px] font-medium text-petrol">
        {contexto.plano ? "Vai executar o seu plano hoje?" : "Vai avançar no seu caminho hoje?"}
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <form action={marcarPresencaAction}>
          <SubmitButton
            pendingText="Registrando..."
            className="rounded-lg bg-gold px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:opacity-90"
          >
            Presente: {contexto.plano ? "vou executar hoje" : "vou avançar hoje"}
          </SubmitButton>
        </form>
        <form action={adiarPresencaAction}>
          <SubmitButton
            pendingText="..."
            className="rounded-lg border border-line px-5 py-3 text-[14px] font-semibold text-ink-muted transition-colors hover:border-petrol hover:text-petrol"
          >
            Só passei por aqui
          </SubmitButton>
        </form>
      </div>
      <p className="mb-9 max-w-[56ch] text-[13px] leading-[1.55] text-ink-muted">
        Cada Presente é um dia em que você se comprometeu a executar o seu plano. Se você só passou por aqui, o dia não é
        marcado.
      </p>

      <div className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
        <p className="mb-4 font-serif text-[18px] font-medium text-petrol">
          {total === 0 ? "O seu primeiro dia começa com um Presente." : `${total} ${total === 1 ? "dia" : "dias"} com você`}
        </p>
        <CalendarioDePresenca
          ano={mes.ano}
          mes={mes.mes}
          presentes={presentes}
          hoje={hoje}
          caminho="/"
        />
      </div>
    </div>
  );
}
