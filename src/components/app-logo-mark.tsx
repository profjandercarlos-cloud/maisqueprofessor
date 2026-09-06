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
      {/* Path e círculo exatos do arquivo original do usuário
          (favicon-512-transparente.svg, viewBox 0 0 512 512) — preenchido
          (fill), não traçado (stroke), então o mesmo path funciona sem
          distorção tanto aqui quanto no Satori (icon.tsx/apple-icon.tsx). */}
      <svg viewBox="0 0 512 512" fill="none" className="h-[90%] w-[90%]">
        <path
          fill="white"
          d="M144 364V159h62l36.5 139L279 159h63v205h-38V202l-41 162h-41l-40-162v162z"
        />
        <circle cx="394.5" cy="146.5" r="43.5" fill="#028192" />
      </svg>
    </div>
  );
}
