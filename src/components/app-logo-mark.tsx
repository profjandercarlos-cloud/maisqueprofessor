import { Manrope } from "next/font/google";

// Só pro monograma — o resto do app usa DM Sans (ver layout.tsx), mas o
// monograma RAS é um ativo de marca fixo (arquivo oficial do usuário,
// ras-monograma-negativo.svg) e mantém a fonte oficial dele
// independentemente da tipografia geral do produto.
const manrope = Manrope({ subsets: ["latin"], weight: "800" });

// Monograma RAS — quadrado navy arredondado, texto "RAS" (R e S brancos,
// "A" em teal) com uma barrinha laranja embaixo, como no arquivo oficial
// do usuário. Posição/tamanho da barra espelham esse arquivo (viewBox
// 512x512), reexpressos em % do quadrado. O fontSize é fixo em px porque
// font-size não aceita % relativo à altura da caixa (só ao font-size do
// elemento pai) — os 4 usos atuais são todos o tamanho padrão (28px,
// h-7 w-7); se um dia precisar de outro tamanho de `className`, ajustar
// esse valor manualmente (ou passar como prop).
export function AppLogoMark({ className }: { className?: string }) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[22%] ${className ?? "h-7 w-7"}`}
      style={{ background: "#081828" }}
    >
      <span
        className={manrope.className}
        style={{ fontSize: 9, fontWeight: 800, letterSpacing: "-0.08em", color: "white", lineHeight: 1 }}
      >
        R<span style={{ color: "#13B8B1" }}>A</span>S
      </span>
      <span
        className="absolute rounded-full"
        style={{ background: "#F36F3D", left: "24.6%", top: "67.8%", width: "50.8%", height: "2.9%" }}
      />
    </div>
  );
}
