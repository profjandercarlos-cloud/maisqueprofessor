import { ImageResponse } from "next/og";

// Ícone da aba do navegador — mesmo desenho de src/components/app-logo-mark.tsx
// (quadrado navy arredondado, "M" branco, ponto turquesa), gerado como PNG
// porque favicon não aceita SVG dinâmico. Se o desenho da marca mudar, mudar
// aqui também (não dá pra importar o componente React direto, o Satori só
// entende um subconjunto de HTML/CSS/SVG).
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1420",
          borderRadius: "22%",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
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
    ),
    { ...size },
  );
}
