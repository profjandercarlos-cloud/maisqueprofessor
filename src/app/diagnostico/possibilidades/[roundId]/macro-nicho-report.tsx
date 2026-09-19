type MacroNicho = {
  nome: string;
  explicacao: string;
  nichoSecundario: string | null;
};

// Mostrado ANTES dos 5 cards — o "aqui está o que suas respostas revelam
// sobre você" que o professor vê primeiro, antes de entrar nos detalhes de
// cada possibilidade. Motor "macro nicho" (2026-09) — rodadas geradas antes
// dessa mudança não têm esse campo (null), então o componente não renderiza
// nada nesse caso.
export function MacroNichoReport({
  macroNicho,
  premissasFinanceirasGerais,
}: {
  macroNicho: unknown;
  premissasFinanceirasGerais: string | null;
}) {
  const nicho = macroNicho as MacroNicho | null;
  if (!nicho) return null;

  return (
    <div className="mb-7 overflow-hidden rounded-[var(--radius-app)] border border-gold bg-gold-soft px-5 py-[18px]">
      <span className="mb-1.5 block font-mono text-[10px] tracking-[0.1em] text-gold uppercase">
        Seu fio condutor
      </span>
      <h2 className="mb-2 font-serif text-[21px] font-medium tracking-tight text-petrol">{nicho.nome}</h2>
      <p className="text-[14px] leading-[1.6] text-ink">{nicho.explicacao}</p>
      {nicho.nichoSecundario ? (
        <p className="mt-2 text-[13px] leading-[1.5] text-ink-muted">
          <span className="font-semibold text-ink">Também vale notar: </span>
          {nicho.nichoSecundario}
        </p>
      ) : null}
      {premissasFinanceirasGerais ? (
        <p className="mt-3 border-t border-gold/30 pt-3 text-[12.5px] leading-[1.5] text-ink-muted italic">
          {premissasFinanceirasGerais}
        </p>
      ) : null}
    </div>
  );
}
