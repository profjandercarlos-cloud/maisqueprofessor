import { ImageResponse } from "next/og";

// Ícone da aba do navegador — mesmo desenho de src/components/app-logo-mark.tsx
// (quadrado navy arredondado, "M" branco, ponto turquesa), gerado como PNG
// porque favicon não aceita SVG dinâmico. Se o desenho da marca mudar, mudar
// aqui também (não dá pra importar o componente React direto, o Satori só
// entende um subconjunto de HTML/CSS/SVG).
//
// O "M" aqui é desenhado como 4 polígonos preenchidos (2 barras verticais +
// 2 diagonais), não como um path com stroke — o Satori (motor do
// ImageResponse) tem suporte ruim a stroke de SVG, o que deixava a perna
// direita do M visivelmente mais grossa e torta que a esquerda. Preenchido
// (fill), o Satori renderiza sem esse problema. As 4 formas são o mesmo
// desenho de "M5 18V6L12 14L19 6V18" com strokeWidth 3.4, só convertido pra
// contorno manual (offset de 1.7 = metade da espessura).
const M_PATH =
  "M3.3,6 L6.7,6 L6.7,18 L3.3,18 Z" +
  "M17.3,6 L20.7,6 L20.7,18 L17.3,18 Z" +
  "M3.72,7.11 L6.28,4.89 L13.28,12.89 L10.72,15.11 Z" +
  "M13.28,15.11 L10.72,12.89 L17.72,4.89 L20.28,7.11 Z";

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
        <svg width="40" height="40" viewBox="0 -3 27 27" fill="none">
          <path d={M_PATH} fill="white" />
          <circle cx="23" cy="0.5" r="3" fill="#028192" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
