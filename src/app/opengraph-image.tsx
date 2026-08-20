import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Confuzzle — make sense of anything.";
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
        }}
      >
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
          Make sense of anything.
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
          Show Confuzzle the page. Get back a version you can act on.
        </div>
      </div>
    ),
    { ...size },
  );
}
