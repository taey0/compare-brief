"use client";

import { useRouter } from "next/navigation";
import TabBar from "../components/TabBar";

function CatTech() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18.01" />
    </svg>
  );
}

function CatFinance() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function CatHealth() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function CatTravel() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function CatFood() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1" />
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

function CatHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-8 9 8" />
      <path d="M5 10v8a1 1 0 001 1h3v-5h6v5h3a1 1 0 001-1v-8" />
    </svg>
  );
}

const CATEGORIES = [
  { icon: CatTech, label: "Tech", query: "Best smartphone under $800", color: "#3b82f6" },
  { icon: CatFinance, label: "Finance", query: "Best savings account with high APY", color: "#10b981" },
  { icon: CatHealth, label: "Health", query: "Best health insurance plans for freelancers", color: "#ef4444" },
  { icon: CatTravel, label: "Travel", query: "Best travel credit card with no annual fee", color: "#8b5cf6" },
  { icon: CatFood, label: "Food", query: "Best meal kit delivery service", color: "#f59e0b" },
  { icon: CatHome, label: "Home", query: "Best robot vacuum for pet hair", color: "#6366f1" },
];

const POPULAR = [
  "Best noise cancelling headphones under $300",
  "Best laptop for college students 2025",
  "Best streaming service for families",
  "Best phone plan for unlimited data",
  "Best mattress for side sleepers",
  "Best budget wireless earbuds",
];

export default function ExplorePage() {
  const router = useRouter();

  function go(query: string) {
    router.push(`/brief?q=${encodeURIComponent(query)}`);
  }

  return (
    <main className="page-with-tabs">
      <div className="container" style={{ maxWidth: 540, paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
        <div style={{ marginTop: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em" }}>Explore</h1>
        </div>

        {/* Categories */}
        <div style={{ marginTop: 20 }}>
          <div className="label" style={{ marginBottom: 10 }}>Categories</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                className="category-card"
                onClick={() => go(cat.query)}
              >
                <div className="category-icon" style={{ background: `${cat.color}12`, color: cat.color }}>
                  <cat.icon />
                </div>
                <div className="category-label">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Popular comparisons */}
        <div style={{ marginTop: 28 }}>
          <div className="label" style={{ marginBottom: 10 }}>Popular comparisons</div>
          <div className="card" style={{ overflow: "hidden" }}>
            {POPULAR.map((q, idx) => (
              <button
                key={q}
                className="settings-row"
                onClick={() => go(q)}
                style={{
                  borderRadius: idx === 0 ? "14px 14px 0 0" : idx === POPULAR.length - 1 ? "0 0 14px 14px" : 0,
                  fontSize: 14,
                  color: "var(--fg-secondary)",
                  fontWeight: 500,
                }}
              >
                <span style={{ flex: 1, textAlign: "left" }}>{q}</span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--muted-light)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      <TabBar />
    </main>
  );
}
