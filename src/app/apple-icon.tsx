import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Ícone pra "Adicionar à Tela de Início" no iOS/iPadOS — mesmo desenho de
// src/components/app-logo-mark.tsx (monograma RAS), ver o comentário em
// icon.tsx sobre a fonte carregada manualmente pro Satori.
const manropeExtraBold = await readFile(
  join(process.cwd(), "src/assets/fonts/Manrope-ExtraBold.woff"),
);

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Manrope",
            fontWeight: 800,
            fontSize: 58,
            letterSpacing: "-4.5px",
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
            height: 5,
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
