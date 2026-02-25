"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "./components/Icons";
import TabBar from "./components/TabBar";
import { getRecentItems, type Brief } from "./lib/storage";

const EXAMPLES = [
  { label: "Phone plans", query: "Best phone plan for international students" },
  { label: "Headphones", query: "Best noise cancelling headphones for calls" },
  { label: "Laptops", query: "Best laptop for design students under $1500" },
  { label: "Credit cards", query: "Best credit card for groceries and travel" },
];

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<{ id: string; brief: Brief }[]>([]);

  const canGo = useMemo(() => q.trim().length > 0, [q]);

  useEffect(() => {
    setRecent(getRecentItems(3));
  }, []);

  function go(query: string) {
    const clean = query.trim();
    if (!clean) return;
    router.push(`/brief?q=${encodeURIComponent(clean)}`);
  }

  return (
    <main className="page-with-tabs">
      {/* Green hero */}
      <div className="hero">
        <div className="container" style={{ maxWidth: 540 }}>
          <div className="hero-brand">
            <img src="/favicon.svg" width={24} height={24} alt="" style={{ borderRadius: 5 }} />
            <span>Pickle</span>
          </div>
          <h1 className="hero-title">Compare anything</h1>
          <p className="hero-subtitle">Pick the best. Skip the rest.</p>
        </div>
      </div>

      {/* Search card overlapping hero */}
      <div className="container" style={{ maxWidth: 540, marginTop: -24 }}>
        <div className="search-card">
          <IconSearch />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What are you comparing?"
            onKeyDown={(e) => {
              if (e.key === "Enter") go(q);
            }}
          />
          {canGo && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => go(q)}
              style={{ height: 34, borderRadius: 8, padding: "0 14px" }}
            >
              Go
            </button>
          )}
        </div>

        {/* Quick picks */}
        <div style={{ marginTop: 20 }}>
          <div className="label" style={{ marginBottom: 8 }}>Try these</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                className="chip"
                onClick={() => go(ex.query)}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent comparisons */}
        {recent.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div className="label" style={{ marginBottom: 8 }}>Recent</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recent.map(({ id, brief }) => (
                <div
                  key={id}
                  className="card"
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                  }}
                  onClick={() => router.push(`/brief?id=${id}`)}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--primary-weak)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 14, color: "var(--primary)", fontWeight: 700 }}>
                      {brief.rows?.length ?? 0}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="h3" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {brief.query}
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: 1 }}>
                      Top: {brief.topPick?.name ?? "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <TabBar />
    </main>
  );
}
