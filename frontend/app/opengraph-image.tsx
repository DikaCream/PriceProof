import { ImageResponse } from "next/og";

export const alt = "PriceProof // ORACLE TERMINAL — web-verified prices on GenLayer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const rows = [
  { sym: "BTC", price: "85627.99", chg: "+1.24%", src: "COINBASE" },
  { sym: "ETH", price: "2700.80", chg: "+0.61%", src: "COINBASE" },
  { sym: "SOL", price: "120.36", chg: "-0.42%", src: "KRAKEN" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#070B09",
          color: "#D7E0DA",
          fontFamily: "monospace",
          padding: 48,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #1C2620",
            paddingBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: "1px solid #00FF9A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00FF9A",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              PP
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 36, color: "#00FF9A", letterSpacing: 2 }}>PRICEPROOF</div>
              <div style={{ fontSize: 18, color: "#8B9A92" }}>// ORACLE TERMINAL</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, color: "#8B9A92" }}>
            <div style={{ width: 10, height: 10, background: "#00FF9A" }} />
            STUDIONET LIVE
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 28, gap: 28, flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 520, justifyContent: "center" }}>
            <div style={{ fontSize: 42, lineHeight: 1.2, color: "#D7E0DA" }}>
              Web-verified prices.
            </div>
            <div style={{ fontSize: 42, lineHeight: 1.2, color: "#00FF9A" }}>Consensus within 1.5%.</div>
            <div style={{ marginTop: 24, fontSize: 22, color: "#8B9A92", lineHeight: 1.45 }}>
              Instrument tape · consensus log · on-chain alert tickets.
            </div>
            <div style={{ marginTop: 28, fontSize: 18, color: "#F5A623" }}>
              &gt; PROPOSING… &gt; COMMITTING… &gt; ACCEPTED 5/5
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              border: "1px solid #1C2620",
              background: "#0F1612",
            }}
          >
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #1C2620",
                padding: "12px 16px",
                fontSize: 14,
                letterSpacing: 2,
                color: "#8B9A92",
              }}
            >
              SYMBOL&nbsp;&nbsp;&nbsp;LAST&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Δ&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SOURCE
            </div>
            {rows.map((r) => (
              <div
                key={r.sym}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 16px",
                  borderBottom: "1px solid #1C2620",
                  fontSize: 22,
                }}
              >
                <span style={{ color: "#00FF9A", width: 70 }}>{r.sym}</span>
                <span style={{ color: "#D7E0DA", width: 160 }}>{r.price}</span>
                <span style={{ color: r.chg.startsWith("-") ? "#FF4D4D" : "#00FF9A", width: 90 }}>{r.chg}</span>
                <span style={{ color: "#F5A623", width: 110 }}>{r.src}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
