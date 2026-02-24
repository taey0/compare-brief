"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  { label: "Phone plans", query: "Best phone plan for international students" },
  { label: "Headphones", query: "Best noise cancelling headphones for calls" },
  { label: "Laptops", query: "Best laptop for design students under $1500" },
  { label: "Credit cards", query: "Best credit card for groceries and travel" },
];

function PickleLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a7f37" />
      <text
        x="14"
        y="19.5"
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="800"
        fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
      >
        P
      </text>
    </svg>
  );
}

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
      <div className="container" style={{ maxWidth: 640, paddingTop: 64 }}>
        {/* Brand + name explanation */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PickleLogo size={32} />
          <span style={{ fontSize: 20, fontWeight: 750, letterSpacing: "-0.03em" }}>
            Pickle
          </span>
        </div>

        <p
          className="text-sm text-muted"
          style={{ marginTop: 6 }}
        >
          Pick the best. Skip the rest.
        </p>

        {/* Hero */}
        <h1 className="h1" style={{ marginTop: 32 }}>
          Compare anything,<br />decide in seconds.
        </h1>

        {/* Input */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What are you comparing?"
              onKeyDown={(e) => {
                if (e.key === "Enter") go(q);
              }}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary btn-lg"
              onClick={() => go(q)}
              disabled={!canGo}
              style={{ flexShrink: 0 }}
            >
              Go
            </button>
          </div>

          {/* Example chips */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 12,
            }}
          >
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                className="chip"
                onClick={() => {
                  setQ(ex.query);
                  go(ex.query);
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
