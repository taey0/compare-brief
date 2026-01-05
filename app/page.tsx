"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  "Best phone plan for international students",
  "Best noise cancelling headphones for calls",
  "Best laptop for design students under $1500",
  "Best credit card for groceries and travel",
];

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const canGo = useMemo(() => q.trim().length > 0, [q]);

  function go(query: string) {
    const clean = query.trim();
    if (!clean) return;
    router.push(`/brief?q=${encodeURIComponent(clean)}`);
  }

  return (
    <main>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="label">CLEARPICK</div>
        </div>

        <div style={{ height: 18 }} />

        <h1 className="h1">Compare faster. Decide clearer.</h1>
        <div style={{ height: 12 }} />
        <p className="sub">
          Type any question and get a clean comparison grid you can trust.
        </p>

        <div style={{ height: 22 }} />

        <section className="card" style={{ padding: 18 }}>
          <div className="label" style={{ marginBottom: 10 }}>
            Your question
          </div>

          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`e.g. "${EXAMPLES[0]}"`}
            onKeyDown={(e) => {
              if (e.key === "Enter") go(q);
            }}
          />

          <div style={{ height: 12 }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className="btn"
                onClick={() => {
                  setQ(ex);
                  go(ex);
                }}
              >
                {ex}
              </button>
            ))}
          </div>

          <div style={{ height: 14 }} />

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn btnPrimary" onClick={() => go(q)} disabled={!canGo}>
              Generate comparison
            </button>

            <div className="sub" style={{ fontSize: 14 }}>
              Tip: Add constraints later (budget, size, must-have features).
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}