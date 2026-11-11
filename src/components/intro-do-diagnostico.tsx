const PASSOS: { titulo: string; texto: string }[] = [
  {
    titulo: "Diagnóstico",
    texto:
      "Você responde cerca de 25 perguntas sobre o que já fez, o que sabe e o que quer. Leva em média de 20 a 30 minutos, e dá para parar e continuar depois: tudo fica salvo.",
  },
  {
    titulo: "Negócios",
    texto:
      "Com as suas respostas, geramos 5 negócios feitos para você. Também há ideias de negócios prontas, iguais para todos os professores, que você pode favoritar.",
  },
  {
    titulo: "Plano",
    texto:
      "De cada negócio (ou ideia favorita) você cria um plano de execução: as ações em ordem, cada uma com checklist. Dá para ter até 5 planos, e só um fica ativo por vez.",
  },
  {
    titulo: "Execução",
    texto:
      "Você executa o plano ativo ação por ação, marca presença nos dias em que se compromete e conquista medalhas a cada marco.",
  },
];

// Primeira tela do diagnóstico: o que vem pela frente, antes da primeira pergunta. Os quatro nomes são
// os mesmos do mapa do Painel e da faixa "Passo X de 4".
export function IntroDoDiagnostico({ comecarHref }: { comecarHref: string }) {
  return (
    <div>
      <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Antes de começar
      </span>
      <h1 className="mb-3 font-serif text-[clamp(26px,5vw,34px)] leading-[1.15] font-medium tracking-tight text-petrol">
        Como o app funciona
      </h1>
      <p className="mb-7 max-w-[52ch] text-[15.5px] text-ink-muted">
        Em quatro passos, você sai das suas respostas e chega a um negócio sendo executado.
      </p>

      <ol className="mb-7 flex flex-col gap-4">
        {PASSOS.map((p, i) => (
          <li key={p.titulo} className="flex gap-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-gold-soft font-mono text-[12px] font-semibold text-petrol">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-serif text-[17px] font-medium text-ink">{p.titulo}</p>
              <p className="text-[14.5px] leading-[1.6] text-ink-muted">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mb-7 rounded-lg bg-gold-soft px-4 py-3 text-[13.5px] leading-[1.55] text-ink">
        <span className="font-semibold">Uma dica:</span> não existe resposta certa. Quanto mais concreto você for, contando
        o que de fato aconteceu com você, mais certeiros ficam os negócios.
      </p>

      <a
        href={comecarHref}
        className="inline-block rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
      >
        Começar o diagnóstico →
      </a>
    </div>
  );
}
