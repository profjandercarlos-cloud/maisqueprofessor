import { ImageResponse } from "next/og";

// Ícone pra "Adicionar à Tela de Início" no iOS/iPadOS — mesmo desenho de
// src/components/app-logo-mark.tsx, ver o comentário em icon.tsx sobre por
// que isso não é importado direto do componente React, e sobre por que o
// "M" aqui é preenchido (fill) em vez de traçado (stroke) — o Satori
// deformava a perna direita do M quando o path usava stroke.
const M_PATH =
  "M3.3,6 L6.7,6 L6.7,18 L3.3,18 Z" +
  "M17.3,6 L20.7,6 L20.7,18 L17.3,18 Z" +
  "M3.72,7.11 L6.28,4.89 L13.28,12.89 L10.72,15.11 Z" +
  "M13.28,15.11 L10.72,12.89 L17.72,4.89 L20.28,7.11 Z";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <svg width="112" height="112" viewBox="0 0 24 24" fill="none">
          <path d={M_PATH} fill="white" />
          <circle cx="19.4" cy="5.1" r="2.4" fill="#028192" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
