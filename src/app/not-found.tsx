import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404: This page could not be found.",
  robots: { index: false },
};

// Plain white 404 in the style of Next.js's built-in page. Also shown for the
// whole site while the admin has it switched off, so nothing hints it exists.
export default function NotFound() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        color: "#000",
        fontFamily:
          'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <h1
        style={{
          display: "inline-block",
          margin: "0 20px 0 0",
          paddingRight: 23,
          fontSize: 24,
          fontWeight: 500,
          lineHeight: "49px",
          borderRight: "1px solid rgba(0,0,0,.3)",
        }}
      >
        404
      </h1>
      <h2 style={{ display: "inline-block", margin: 0, fontSize: 14, fontWeight: 400, lineHeight: "49px" }}>
        This page could not be found.
      </h2>
    </div>
  );
}
