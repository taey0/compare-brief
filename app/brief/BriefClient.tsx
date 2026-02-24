"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LZString from "lz-string";

/* ── Types ── */
type Source = { title: string; url: string };

type Brief = {
  query: string;
  constraints: string;
  topPick: { name: string; why: string; tradeoff: string };
  columns: string[];
  columnHelp: string[];
  rows: { name: string; values: string[]; notes: string }[];
  sources: Source[];
  _mode?: string;
};

/* ── Helpers ── */
const STORAGE_KEY = "pickle:v1";

function clampText(s: string, max = 130) {
  const t = (s ?? "").toString().trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "\u2026";
}

function readStore(): Record<string, Brief> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, Brief>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

function getApiBase() {
  if (typeof window === "undefined") return "";
  // In Capacitor, content is served from capacitor:// or file://
  const proto = window.location.protocol;
  if (proto === "capacitor:" || proto === "file:") {
    return "https://compare-brief.vercel.app";
  }
  return "";
}

const API_BASE = getApiBase();

async function fetchBrief(payload: {
  query: string;
  constraints: string;
  columns: string[];
}): Promise<Brief> {
  const res = await fetch(`${API_BASE}/api/brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to generate brief");

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server returned a non-JSON response");
  }
}

function encodePortable(b: Brief) {
  return LZString.compressToEncodedURIComponent(JSON.stringify(b));
}

function decodePortable(s: string): Brief | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(s);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/* ── Icons (minimal) ── */
function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 12L6 8l4-4" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8" />
      <polyline points="8 2 8 10" />
      <polyline points="5 5 8 2 11 5" />
    </svg>
  );
}

function IconRedo() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2v4.5h-4.5" />
      <path d="M12.9 10a5.5 5.5 0 11-8.8-5.5l10.4 2" />
    </svg>
  );
}

function PickleLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
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

/* ── Component ── */
export default function BriefClient() {
  const router = useRouter();
  const params = useSearchParams();

  const qParam = (params.get("q") ?? "").trim();
  const cParam = (params.get("c") ?? "").trim();
  const idParam = (params.get("id") ?? "").trim();
  const dataParam = (params.get("data") ?? "").trim();

  const defaultQuery = "Best noise cancelling headphones for calls";

  const [columns, setColumns] = useState<string[]>([
    "Price",
    "Key feature",
    "Best for",
    "Drawback",
    "Where to buy",
  ]);
  const [showCriteria, setShowCriteria] = useState(false);
  const [data, setData] = useState<Brief | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const query = useMemo(() => qParam || defaultQuery, [qParam]);
  const constraints = useMemo(() => cParam || "", [cParam]);

  /* ── Data loading ── */
  useEffect(() => {
    if (dataParam) {
      const decoded = decodePortable(dataParam);
      if (decoded) { setData(decoded); setStatus("success"); }
    }
  }, [dataParam]);

  useEffect(() => {
    if (!idParam) return;
    const store = readStore();
    const found = store[idParam];
    if (found) { setData(found); setStatus("success"); }
  }, [idParam]);

  useEffect(() => {
    if (dataParam || idParam) return;
    let cancelled = false;

    async function run() {
      setStatus("loading");
      setErrorMsg("");
      setData(null);
      try {
        const result = await fetchBrief({ query, constraints, columns });
        if (cancelled) return;
        setData(result);
        setStatus("success");
      } catch (e: unknown) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "Failed to generate brief");
        setStatus("error");
      }
    }

    run();
    return () => { cancelled = true; };
  }, [query, constraints, columns, dataParam, idParam]);

  /* ── Actions ── */
  function sharePortable() {
    if (!data) return;
    const packed = encodePortable(data);
    const url = `${window.location.origin}/brief?data=${packed}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function regenerate() {
    router.push(
      `/brief?q=${encodeURIComponent(query)}&c=${encodeURIComponent(constraints)}`
    );
  }

  return (
    <main>
      <div className="container">
        {/* ── Nav ── */}
        <nav className="nav">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => router.push("/")}
              aria-label="Back"
              style={{ padding: "0 6px" }}
            >
              <IconBack />
            </button>
            <div
              className="nav-brand"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/")}
            >
              <PickleLogo />
              Pickle
            </div>
          </div>

          <div className="nav-actions">
            <button
              className="btn btn-sm"
              onClick={sharePortable}
              disabled={!data}
            >
              <IconShare /> {copied ? "Copied!" : "Share"}
            </button>
            <button className="btn btn-primary btn-sm" onClick={regenerate}>
              <IconRedo /> Redo
            </button>
          </div>
        </nav>

        {/* ── Query ── */}
        <div style={{ marginTop: 20 }}>
          <h1 className="h1">{query}</h1>
          {constraints && (
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>
              {constraints}
            </p>
          )}
        </div>

        {/* ── Criteria toggle ── */}
        <div style={{ marginTop: 16 }}>
          <button
            className="btn btn-sm"
            onClick={() => setShowCriteria(!showCriteria)}
          >
            {showCriteria ? "Hide columns" : "Edit columns"}
            <span className="badge badge-muted" style={{ marginLeft: 2 }}>
              {columns.filter(Boolean).length}
            </span>
          </button>

          {showCriteria && (
            <div className="card" style={{ marginTop: 8, padding: 14 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: 8,
                }}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <input
                    key={i}
                    className="input"
                    value={columns[i] ?? ""}
                    onChange={(e) => {
                      const next = [...columns];
                      next[i] = e.target.value;
                      setColumns(next);
                    }}
                    placeholder={["Price", "Feature", "Best for", "Downside", "Notes"][i]}
                    style={{ height: 36, fontSize: 13 }}
                  />
                ))}
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={regenerate}
                style={{ marginTop: 10 }}
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* ── Loading ── */}
        {status === "loading" && (
          <div
            style={{
              marginTop: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div className="spinner" />
            <p className="text-sm text-muted">Comparing options...</p>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div
            className="card"
            style={{ marginTop: 24, padding: 20, borderColor: "#fecaca" }}
          >
            <p className="h3" style={{ color: "var(--danger)" }}>
              Something went wrong
            </p>
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>
              {errorMsg}
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={regenerate}
              style={{ marginTop: 10 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Results ── */}
        {status === "success" && data && (
          <>
            {/* Top Pick */}
            <div
              className="card"
              style={{
                marginTop: 24,
                padding: "16px 20px",
                borderLeft: "4px solid var(--primary)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="badge badge-primary">Top pick</span>
              </div>
              <div className="h2" style={{ marginTop: 6 }}>
                {clampText(data.topPick?.name ?? "Top pick", 80)}
              </div>
              <p className="text-sm text-secondary" style={{ marginTop: 6, lineHeight: 1.6 }}>
                {clampText(data.topPick?.why ?? "", 200)}
              </p>
              {data.topPick?.tradeoff && (
                <p className="text-sm text-muted" style={{ marginTop: 6 }}>
                  <strong>Trade-off:</strong> {clampText(data.topPick.tradeoff, 160)}
                </p>
              )}
            </div>

            {/* Table */}
            <div style={{ marginTop: 24 }}>
              <div className="section-header">
                <span className="label">Comparison</span>
                <span className="badge badge-muted">{(data.rows ?? []).length} options</span>
              </div>

              <div className="card" style={{ overflow: "hidden" }}>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Option</th>
                        {(data.columns ?? []).map((col, idx) => (
                          <th key={`${col}-${idx}`} title={(data.columnHelp ?? [])[idx] ?? ""}>
                            {col}
                          </th>
                        ))}
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.rows ?? []).map((row, rIdx) => (
                        <tr key={`${row.name}-${rIdx}`}>
                          <td>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              {row.name === data.topPick?.name && (
                                <span
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: "var(--primary)",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              {row.name}
                            </span>
                          </td>
                          {(data.columns ?? []).map((_, cIdx) => (
                            <td key={`${rIdx}-${cIdx}`}>
                              {clampText((row.values ?? [])[cIdx] ?? "", 60) || "\u2014"}
                            </td>
                          ))}
                          <td className="text-sm text-muted">
                            {clampText(row.notes ?? "", 80) || "\u2014"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sources */}
            {(data.sources ?? []).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <span className="label">Sources</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {(data.sources ?? []).map((s, idx) => (
                    <a
                      key={`${s.url}-${idx}`}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="chip"
                      style={{ textDecoration: "none", fontSize: 12 }}
                    >
                      {s.title || new URL(s.url).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div style={{ height: 40 }} />
          </>
        )}
      </div>
    </main>
  );
}
