"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#10213A",
          color: "#fff",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>
            Something went wrong
          </h1>
          <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>
            {error.message || "A critical error occurred."}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#E63946",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              padding: "0.65rem 1.25rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
