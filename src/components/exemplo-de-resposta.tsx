import type { ExemploDeResposta } from "@/lib/diagnostico/exemplos";

// Mostra uma resposta que ajuda e uma que atrapalha, para a pessoa entender o que a pergunta pede
// antes de escrever. Aberto por padrão: é curto e é o que mais evita a resposta fora do pedido.
export function ExemploDeRespostaBox({ exemplo }: { exemplo: ExemploDeResposta }) {
  return (
    <section
      aria-label="Exemplo de como responder"
      className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-4 text-[13.5px] leading-[1.55]"
    >
      <p className="mb-1 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">Exemplo de como responder</p>
      <p className="mb-3 text-ink-muted">Só para mostrar o formato. Conte a sua própria história, com as suas palavras.</p>

      <div className="mb-3">
        <p className="mb-1 text-[12px] font-semibold text-petrol">✓ Resposta que ajuda</p>
        <p className="whitespace-pre-line text-ink">{exemplo.bom}</p>
      </div>
      <div>
        <p className="mb-1 text-[12px] font-semibold text-ink-muted">✕ Resposta que atrapalha</p>
        <p className="whitespace-pre-line text-ink-muted">{exemplo.fraco}</p>
        <p className="mt-1 text-[12.5px] text-ink-muted">{exemplo.porque}</p>
      </div>
    </section>
  );
}
