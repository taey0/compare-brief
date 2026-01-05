"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LZString from "lz-string";

type Source = { title: string; url: string };

type Brief = {
  query: string;
  constraints: string;
  topPick: { name: string; why: string; tradeoff: string };
  columns: string[];
  columnHelp: string[];
  rows: { name: string; values: string[]; notes: string }[];
  sources: Source[];
  _mode?: string; // demo_no_key / demo_quota / live ...
};

const STORAGE_KEY = "clearpick:v1";

function clampText(s: string, max = 130) {
  const t = (s ?? "").toString().trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
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

async function fetchBrief(payload: {
  query: string;
  constraints: string;
  columns: string[];
}): Promise<Brief> {
  const res = await fetch("/api/brief", {
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
  const json = JSON.stringify(b);
  return LZString.compressToEncodedURIComponent(json);
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

  const [data, setData] = useState<Brief | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string>("");

  const query = useMemo(() => qParam || defaultQuery, [qParam]);
  const constraints = useMemo(() => cParam || "", [cParam]);

  // Load shared links
  useEffect(() => {
    if (dataParam) {
      const decoded = decodePortable(dataParam);
      if (decoded) {
        setData(decoded);
        setStatus("success");
      }
    }
  }, [dataParam]);

  // Load local storage by id
  useEffect(() => {
    if (!idParam) return;
    const store = readStore();
    const found = store[idParam];
    if (found) {
      setData(found);
      setStatus("success");
    }
  }, [idParam]);

  // Generate (only if not loaded from share/local)
  useEffect(() => {
    if (dataParam) return;
    if (idParam) return;

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
      } catch (e: any) {
        if (cancelled) return;
        setErrorMsg(e?.message ?? "Failed to generate brief");
        setStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [query, constraints, columns, dataParam, idParam]);

  function shareLocal() {
    if (!data) return;
    const store = readStore();
    const id = Math.random().toString(36).slice(2, 10);
    store[id] = data;
    writeStore(store);
    router.push(`/brief?id=${encodeURIComponent(id)}`);
  }

  function sharePortable() {
    if (!data) return;
    const packed = encodePortable(data);
    router.push(`/brief?data=${packed}`);
  }

  function regenerate() {
    router.push(`/brief?q=${encodeURIComponent(query)}&c=${encodeURIComponent(constraints)}`);
  }

  return (
    <main>
      <div className="container">
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <button className="btn" onClick={() => router.push("/")}>
            ← Back
          </button>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="label">ClearPick</div>
            <button className="btn" onClick={sharePortable} disabled={!data}>
              Share (Portable)
            </button>
            <button className="btn" onClick={shareLocal} disabled={!data}>
              Share (Local)
            </button>
            <button className="btn btnPrimary" onClick={regenerate}>
              Regenerate
            </button>
          </div>
        </div>

        <div style={{ height: 18 }} />

        {/* Header */}
        <div className="label">COMPARISON GRID</div>
        <div style={{ height: 10 }} />
        <h1 className="h1">{query}</h1>
        <div style={{ height: 10 }} />
        <p className="sub">
          {constraints ? `Constraints: ${constraints}` : "No constraints"}
          {data?._mode ? ` · Mode: ${data._mode}` : ""}
        </p>

        <div style={{ height: 20 }} />

        {/* Criteria editor */}
        <section className="card" style={{ padding: 18 }}>
          <div className="label" style={{ marginBottom: 10 }}>
            Criteria
          </div>
          <p className="sub" style={{ fontSize: 14, marginBottom: 14 }}>
            Edit up to 5 columns, then regenerate.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="label" style={{ marginBottom: 6 }}>
                  Column {i + 1}
                </div>
                <input
                  className="input"
                  value={columns[i] ?? ""}
                  onChange={(e) => {
                    const next = [...columns];
                    next[i] = e.target.value;
                    setColumns(next);
                  }}
                  placeholder={`e.g. ${["Price", "Battery", "Comfort", "Shipping", "Warranty"][i]}`}
                />
              </div>
            ))}
          </div>

          <div style={{ height: 12 }} />
          <button className="btn btnPrimary" onClick={regenerate}>
            Regenerate
          </button>
        </section>

        <div style={{ height: 16 }} />

        {/* Loading / Error */}
        {status === "loading" && (
          <section className="card" style={{ padding: 18 }}>
            <div className="label">Generating…</div>
            <div style={{ height: 8 }} />
            <p className="sub">Pickle is comparing options.</p>
          </section>
        )}

        {status === "error" && (
          <section className="card" style={{ padding: 18 }}>
            <div className="label" style={{ color: "#b91c1c" }}>
              Error
            </div>
            <div style={{ height: 8 }} />
            <p className="sub" style={{ whiteSpace: "pre-wrap" }}>
              {errorMsg || "Failed to generate brief"}
            </p>
            <div style={{ height: 12 }} />
            <button className="btn btnPrimary" onClick={regenerate}>
              Retry
            </button>
          </section>
        )}

        {/* Success */}
        {status === "success" && data && (
          <>
            {/* Pickle suggests */}
            <section className="card" style={{ padding: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <div className="label">Pickle suggests</div>
                  <div style={{ height: 6 }} />
                  <div style={{ fontSize: 18, fontWeight: 750 }}>
                    {clampText(data.topPick?.name ?? "Top pick", 80)}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(15,23,42,0.12)",
                    background: "rgba(37,99,235,0.10)",
                    color: "#1e40af",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  AI assistant: Pickle
                </div>
              </div>

              <div style={{ height: 10 }} />
              <p className="sub" style={{ color: "#0b1220" }}>
                {clampText(data.topPick?.why ?? "", 160)}
              </p>
              <div style={{ height: 6 }} />
              <p className="sub" style={{ fontSize: 14 }}>
                <b>Trade-off:</b> {clampText(data.topPick?.tradeoff ?? "", 140)}
              </p>
            </section>

            <div style={{ height: 16 }} />

            {/* Table */}
            <section className="card" style={{ padding: 18 }}>
              <div className="label" style={{ marginBottom: 10 }}>
                Comparison table
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      <th style={{ padding: "10px 10px", borderBottom: "1px solid var(--border)" }}>
                        Item
                      </th>
                      {(data.columns ?? []).map((col, idx) => (
                        <th
                          key={`${col}-${idx}`}
                          style={{ padding: "10px 10px", borderBottom: "1px solid var(--border)" }}
                          title={(data.columnHelp ?? [])[idx] ?? ""}
                        >
                          {col}
                        </th>
                      ))}
                      <th style={{ padding: "10px 10px", borderBottom: "1px solid var(--border)" }}>
                        Notes
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {(data.rows ?? []).map((row, rIdx) => (
                      <tr key={`${row.name}-${rIdx}`}>
                        <td style={{ padding: "12px 10px", borderBottom: "1px solid var(--border)", fontWeight: 650 }}>
                          {row.name}
                        </td>
                        {(data.columns ?? []).map((_, cIdx) => (
                          <td key={`${rIdx}-${cIdx}`} style={{ padding: "12px 10px", borderBottom: "1px solid var(--border)" }}>
                            {clampText((row.values ?? [])[cIdx] ?? "", 60) || "—"}
                          </td>
                        ))}
                        <td style={{ padding: "12px 10px", borderBottom: "1px solid var(--border)" }}>
                          {clampText(row.notes ?? "", 80) || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div style={{ height: 16 }} />

            {/* Sources */}
            <section className="card" style={{ padding: 18 }}>
              <div className="label" style={{ marginBottom: 10 }}>
                Sources
              </div>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {(data.sources ?? []).map((s, idx) => (
                  <li key={`${s.url}-${idx}`} style={{ marginBottom: 8 }}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#2563eb", textDecoration: "underline" }}
                    >
                      {s.title || s.url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}