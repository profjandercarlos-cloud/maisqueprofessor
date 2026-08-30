import { ImageResponse } from "next/og";

// Ícone pra "Adicionar à Tela de Início" no iOS/iPadOS — mesmo desenho de
// src/components/app-logo-mark.tsx, ver o comentário em icon.tsx sobre por
// que isso não é importado direto do componente React.
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
