"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LZString from "lz-string";
import { IconBack, IconMore, IconShare, IconRedo, IconNewSearch } from "../components/Icons";
import TabBar from "../components/TabBar";
import { type Brief, readStore, saveToHistory } from "../lib/storage";

/* ── Helpers ── */
function clampText(s: string, max = 130) {
  const t = (s ?? "").toString().trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "\u2026";
}

function getApiBase() {
  if (typeof window === "undefined") return "";
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

/* ── Component ── */
export default function BriefClient() {
  const router = useRouter();
  const params = useSearchParams();
  const savedRef = useRef(false);

  const qParam = (params.get("q") ?? "").trim();
  const cParam = (params.get("c") ?? "").trim();
  const idParam = (params.get("id") ?? "").trim();
  const dataParam = (params.get("data") ?? "").trim();

  const defaultQuery = "Best noise cancelling headphones for calls";
  const defaultColumns = ["Price", "Key feature", "Best for", "Drawback", "Where to buy"];

  const [data, setData] = useState<Brief | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const query = useMemo(() => qParam || defaultQuery, [qParam]);
  const constraints = useMemo(() => cParam || "", [cParam]);

  /* ── Auto-save to history on success ── */
  useEffect(() => {
    if (status === "success" && data && !savedRef.current && !idParam && !dataParam) {
      savedRef.current = true;
      saveToHistory(data);
    }
  }, [status, data, idParam, dataParam]);

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
      savedRef.current = false;
      try {
        const result = await fetchBrief({ query, constraints, columns: defaultColumns });
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
  }, [query, constraints, dataParam, idParam]);

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
    <main className="page-with-tabs">
      <div className="container" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
        {/* ── Nav ── */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 44,
        }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push("/")}
            aria-label="Back"
            style={{ padding: "0 6px", marginLeft: -6 }}
          >
            <IconBack />
          </button>

          <div style={{ position: "relative" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="More actions"
              style={{ padding: "0 8px" }}
            >
              <IconMore />
            </button>

            {menuOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 90 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => { sharePortable(); setMenuOpen(false); }}>
                    <IconShare /> Copy share link
                  </button>
                  <button className="dropdown-item" onClick={() => { regenerate(); setMenuOpen(false); }}>
                    <IconRedo /> Regenerate
                  </button>
                  <button className="dropdown-item" onClick={() => { router.push("/"); setMenuOpen(false); }}>
                    <IconNewSearch /> New comparison
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* ── Query title ── */}
        <div style={{ marginTop: 4 }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 750,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            color: "var(--fg)",
          }}>
            {query}
          </h1>
          {constraints && (
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>
              {constraints}
            </p>
          )}
        </div>

        {/* ── Loading ── */}
        {status === "loading" && (
          <div style={{
            marginTop: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}>
            <div className="spinner" />
            <p className="text-sm text-muted">Comparing...</p>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--danger)", fontWeight: 600 }}>
              Something went wrong
            </p>
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>
              {errorMsg}
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={regenerate}
              style={{ marginTop: 12 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Results ── */}
        {status === "success" && data && (
          <>
            {/* Top Pick */}
            <div style={{
              marginTop: 20,
              padding: "14px 16px",
              background: "var(--primary-weak)",
              borderRadius: 12,
              borderLeft: "3px solid var(--primary)",
            }}>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--primary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}>
                Top pick
              </span>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                marginTop: 4,
                color: "var(--fg)",
              }}>
                {clampText(data.topPick?.name ?? "—", 80)}
              </div>
              <p className="text-sm" style={{
                marginTop: 4,
                color: "var(--fg-secondary)",
                lineHeight: 1.5,
              }}>
                {clampText(data.topPick?.why ?? "", 160)}
              </p>
              {data.topPick?.tradeoff && (
                <p className="text-xs text-muted" style={{ marginTop: 4 }}>
                  Caveat: {clampText(data.topPick.tradeoff, 120)}
                </p>
              )}
            </div>

            {/* Table */}
            <div style={{ marginTop: 20 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}>
                <span className="label">{(data.rows ?? []).length} options compared</span>
              </div>

              <div className="card" style={{ overflow: "hidden" }}>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Option</th>
                        {(data.columns ?? []).map((col, idx) => (
                          <th key={`${col}-${idx}`}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(data.rows ?? []).map((row, rIdx) => (
                        <tr key={`${row.name}-${rIdx}`}>
                          <td>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              {row.name === data.topPick?.name && (
                                <span style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: "var(--primary)",
                                  flexShrink: 0,
                                }} />
                              )}
                              {row.name}
                            </span>
                          </td>
                          {(data.columns ?? []).map((_, cIdx) => (
                            <td key={`${rIdx}-${cIdx}`}>
                              {clampText((row.values ?? [])[cIdx] ?? "", 60) || "\u2014"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sources */}
            {(data.sources ?? []).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <span className="label">Sources</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {(data.sources ?? []).map((s, idx) => (
                    <a
                      key={`${s.url}-${idx}`}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="chip"
                      style={{ textDecoration: "none", fontSize: 12, height: 28, padding: "0 10px" }}
                    >
                      {s.title || new URL(s.url).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Copied toast */}
            {copied && (
              <div style={{
                position: "fixed",
                bottom: 80,
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--fg)",
                color: "white",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                zIndex: 100,
              }}>
                Link copied
              </div>
            )}
          </>
        )}
      </div>

      <TabBar />
    </main>
  );
}
