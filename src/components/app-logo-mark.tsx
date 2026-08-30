// Ícone da marca — quadrado navy arredondado, "M" branco e um ponto
// turquesa, como um acento. Desenhado como path (não texto), pro "M" ficar
// idêntico em qualquer navegador e não depender de fonte carregada — mesma
// técnica já usada aqui antes.
export function AppLogoMark({ className }: { className?: string }) {
  return (
    // Cores fixas (não usa --petrol/--gold): a marca deve ficar igual nos
    // dois temas, não seguir a inversão claro/escuro do resto da UI — como
    // --petrol vira claro no modo escuro (pra servir de cor de texto), usar
    // a variável aqui deixaria a marca com fundo quase branco à noite.
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-[22%] ${className ?? "h-7 w-7"}`}
      style={{ background: "#0b1420" }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]">
        <path
          d="M5 18V6L12 14L19 6V18"
          stroke="white"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="19.4" cy="5.1" r="2.4" fill="#028192" />
      </svg>
    </div>
  );
}
