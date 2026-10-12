import { ImageResponse } from "next/og";

export const alt = "PriceProof // MARKET TERMINAL — prediction markets resolved by GenLayer AI validators from the web";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const rows = [
  { id: "#0", q: "Did Argentina win the 2022 World Cup final?", yes: 74, st: "FINALIZED", out: "YES" },
  { id: "#1", q: "Will the Fed cut rates at its next meeting?", yes: 58, st: "OPEN", out: "T-02:14:09" },
  { id: "#2", q: "Did Croatia win the 2018 World Cup final?", yes: 31, st: "PROPOSED", out: "NO" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#070B09", color: "#D7E0DA", fontFamily: "monospace", padding: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1C2620", paddingBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, border: "1px solid #00FF9A", display: "flex", alignItems: "center", justifyContent: "center", color: "#00FF9A", fontSize: 18, fontWeight: 700 }}>PP</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 36, color: "#00FF9A", letterSpacing: 2 }}>PRICEPROOF</div>
              <div style={{ fontSize: 18, color: "#8B9A92" }}>// MARKET TERMINAL</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, color: "#8B9A92" }}>
            <div style={{ width: 10, height: 10, background: "#00FF9A" }} />
            GENLAYER STUDIONET
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
          <div style={{ fontSize: 46, lineHeight: 1.15 }}>Prediction markets resolved</div>
          <div style={{ fontSize: 46, lineHeight: 1.15, color: "#00FF9A" }}>by AI validators reading the web.</div>
          <div style={{ marginTop: 14, fontSize: 21, color: "#8B9A92" }}>Frozen sources · verbatim evidence on-chain · dispute window · appeal round</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 30, border: "1px solid #1C2620", background: "#0F1612" }}>
          {rows.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 18px", borderBottom: "1px solid #1C2620", fontSize: 19 }}>
              <div style={{ color: "#8B9A92", width: 36 }}>{r.id}</div>
              <div style={{ flex: 1, color: "#D7E0DA" }}>{r.q}</div>
              <div style={{ color: "#00FF9A", width: 90 }}>{`Y ${r.yes}%`}</div>
              <div style={{ display: "flex", width: 120, height: 8, background: "#FF4D4D" }}>
                <div style={{ width: `${r.yes}%`, height: 8, background: "#00FF9A" }} />
              </div>
              <div style={{ width: 130, color: r.st === "OPEN" ? "#00FF9A" : r.st === "PROPOSED" ? "#F5A623" : "#8B9A92" }}>{r.st}</div>
              <div style={{ width: 130, color: r.out === "YES" ? "#00FF9A" : r.out === "NO" ? "#FF4D4D" : "#D7E0DA" }}>{r.out}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
