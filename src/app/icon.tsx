import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Ícone da aba do navegador — mesmo desenho de src/components/app-logo-mark.tsx
// (monograma RAS: quadrado navy arredondado, texto "RAS" com o "A" em teal
// e uma barra laranja embaixo), gerado como PNG porque favicon não aceita
// SVG dinâmico. Se o desenho da marca mudar, mudar aqui também (não dá pra
// importar o componente React direto, o Satori só entende um subconjunto
// de HTML/CSS/SVG) — e a fonte Manrope precisa ser carregada manualmente
// aqui, já que o Satori não tem acesso ao Google Fonts do next/font.
const manropeExtraBold = await readFile(
  join(process.cwd(), "src/assets/fonts/Manrope-ExtraBold.woff"),
);

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#081828",
          borderRadius: "22%",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Manrope",
            fontWeight: 800,
            fontSize: 21,
            letterSpacing: "-1.5px",
            color: "white",
            lineHeight: 1,
          }}
        >
          <span>R</span>
          <span style={{ color: "#13B8B1" }}>A</span>
          <span>S</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: "24.6%",
            top: "67.8%",
            width: "50.8%",
            height: 2,
            background: "#F36F3D",
            borderRadius: 999,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Manrope", data: manropeExtraBold, weight: 800, style: "normal" }],
    },
  );
}
