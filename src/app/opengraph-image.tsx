import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Confuzzle — for people who are confuzzled.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#07070a",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: 720,
            height: 420,
            top: -120,
            left: -80,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(139,92,246,0.38), transparent 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: 560,
            height: 360,
            top: -80,
            right: -60,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(34,211,238,0.22), transparent 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            width: 128,
            height: 128,
            borderRadius: 32,
            background: "#000000",
            border: "2px solid #2a2a32",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
          }}
        >
          C?
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 20,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#a78bfa",
          }}
        >
          Confuzzle
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 58,
            fontWeight: 800,
            letterSpacing: -1.4,
            textAlign: "center",
            maxWidth: 920,
            lineHeight: 1.1,
          }}
        >
          You’re confuzzled. Show it the problem.
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 26,
            color: "#c4c4cc",
            textAlign: "center",
            maxWidth: 760,
          }}
        >
          Paste, scan, or import the situation. Confuzzle deciphers it so you can keep going.
        </div>
      </div>
    ),
    { ...size },
  );
}
