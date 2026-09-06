import { ImageResponse } from "next/og";

// Ícone pra "Adicionar à Tela de Início" no iOS/iPadOS — mesmo desenho de
// src/components/app-logo-mark.tsx. Path e círculo exatos do arquivo
// original do usuário (favicon-512-transparente.svg, viewBox 0 0 512 512),
// ver o comentário em icon.tsx.
const M_PATH =
  "M144 364V159h62l36.5 139L279 159h63v205h-38V202l-41 162h-41l-40-162v162z";

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
        <svg width="162" height="162" viewBox="0 0 512 512" fill="none">
          <path d={M_PATH} fill="white" />
          <circle cx="394.5" cy="146.5" r="43.5" fill="#028192" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
