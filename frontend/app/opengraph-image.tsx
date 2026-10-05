import { ImageResponse } from "next/og";

export const alt = "PriceProof: crypto prices verified by GenLayer validator consensus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const rows = [
  { sym: "BTC", price: "$85,627.99", src: "Coinbase", up: true },
  { sym: "ETH", price: "$2,700.80", src: "Coinbase", up: true },
  { sym: "SOL", price: "$120.36", src: "Coinbase", up: false },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 64,
          background: "radial-gradient(900px 520px at 0% 0%, rgba(45,212,191,0.30), transparent 60%), #03110f",
          color: "#f1f5f9",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 600, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "rgba(45,212,191,0.18)",
                border: "2px solid rgba(94,234,212,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M15 7h6v6" />
              </svg>
            </div>
            <div style={{ fontSize: 64, fontWeight: 700 }}>PriceProof</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 32, fontSize: 48, fontWeight: 600, lineHeight: 1.15 }}>
            <span>Crypto prices,</span>
            <span style={{ color: "#5eead4" }}>verified by consensus.</span>
          </div>
          <div style={{ marginTop: 24, fontSize: 26, color: "#94a3b8", lineHeight: 1.4 }}>
            Validators fetch prices from the web and must agree within 1.5%. Live status, history and on-chain alerts.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, marginLeft: 48, width: 440 }}>
          {rows.map((r) => (
            <div
              key={r.sym}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "22px 26px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{r.sym}</span>
                <span style={{ fontSize: 18, color: "#94a3b8" }}>verified · {r.src}</span>
              </div>
              <span style={{ fontSize: 34, fontWeight: 600, color: r.up ? "#6ee7b7" : "#fda4af" }}>{r.price}</span>
            </div>
          ))}
          <div style={{ display: "flex", fontSize: 20, color: "#5eead4" }}>BTC above $100,000 · alert active</div>
        </div>
      </div>
    ),
    size,
  );
}
