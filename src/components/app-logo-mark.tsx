// Ícone provisório da marca — uma seta apontando pra frente/cima, remetendo
// a "clareza para o seu próximo passo" (mesmo mote da página de vendas).
// Só um placeholder simples até existir uma marca definitiva; trocar aqui
// no dia em que houver um ícone final, sem precisar mexer nos 3 lugares
// que usam este componente (app-header.tsx x2, auth-shell.tsx).
export function AppLogoMark({ className }: { className?: string }) {
  return (
    // Cores fixas (não usa --petrol/--gold): a marca deve ficar igual nos
    // dois temas, não seguir a inversão claro/escuro do resto da UI — como
    // --petrol vira claro no modo escuro (pra servir de cor de texto), usar
    // a variável aqui deixaria a marca com fundo quase branco à noite.
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-lg ${className ?? "h-7 w-7"}`}
      style={{ background: "#0b1420" }}
    >
      <svg viewBox="0 0 20 20" fill="none" className="h-[55%] w-[55%]">
        <path
          d="M5 15 L15 5M15 5H8.5M15 5V11.5"
          stroke="#028192"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
