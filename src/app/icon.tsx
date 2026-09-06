import { ImageResponse } from "next/og";

// Ícone da aba do navegador — mesmo desenho de src/components/app-logo-mark.tsx
// (quadrado navy arredondado, "M" branco, ponto turquesa), gerado como PNG
// porque favicon não aceita SVG dinâmico. Se o desenho da marca mudar, mudar
// aqui também (não dá pra importar o componente React direto, o Satori só
// entende um subconjunto de HTML/CSS/SVG).
//
// Path e círculo exatos do arquivo original do usuário
// (favicon-512-transparente.svg, viewBox 0 0 512 512) — já preenchido
// (fill), não traçado, então o Satori renderiza sem a distorção que dava
// com um path de stroke.
const M_PATH =
  "M144 364V159h62l36.5 139L279 159h63v205h-38V202l-41 162h-41l-40-162v162z";

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
        <svg width="58" height="58" viewBox="0 0 512 512" fill="none">
          <path d={M_PATH} fill="white" />
          <circle cx="394.5" cy="146.5" r="43.5" fill="#028192" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
