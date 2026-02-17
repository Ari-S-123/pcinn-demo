import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const alt = "PCINN - Polymer Chemistry Neural Network";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)",
        color: "#f8fafc",
        padding: "64px 72px",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 28,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#d4a053",
        }}
      >
        {siteConfig.name}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 960 }}>
        <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.05 }}>
          Polymer Chemistry Informed Neural Network
        </div>
        <div style={{ fontSize: 34, lineHeight: 1.3, opacity: 0.88 }}>
          Compare Baseline NN, PCINN, and SA-PCINN polymer property predictions
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
