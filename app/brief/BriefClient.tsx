"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Source = { title: string; url: string };

type Brief = {
  query: string;
  constraints: string;
  topPick: { name: string; why: string; tradeoff: string };
  columns: string[];
  columnHelp: string[];
  rows: { name: string; values: string[]; notes: string }[];
  sources: Source[];
  _mode?: string; // demo_no_key / demo_quota / etc (optional)
};

const STORAGE_KEY = "clearpick:v1";

function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(2, 6);
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
  } catch {
    // ignore
  }
}

function encodePortable(obj: any) {
  // No external deps. Simple, reliable for portfolio.
  // (URL can be long, but fine for demos.)
  const json = JSON.stringify(obj);
  return encodeURIComponent(json);
}

function decodePortable(s: string) {
  const json = decodeURIComponent(s);
  return JSON.parse(json);
}

async function fetchBrief(payload: {
  query: string;
  constraints: string;
  columns?: string[];
}): Promise<Brief> {
  const res = await fetch("/api/brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to generate brief");

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server returned a non-JSON response");
  }
}

export default function BriefClient() {
  const router = useRouter();
  const params = useSearchParams();

  const qParam = (params.get("q") ?? "").trim();
  const cParam = (params.get("c") ?? "").trim();
  const idParam = (params.get("id") ?? "").trim();
  const pParam = (params.get("p") ?? "").trim(); // portable payload

  const defaultQuery = "best noise cancelling headphones for calls";
  const query = qParam || defaultQuery;
  const constraints = cParam || "None";

  const [loadedFrom, setLoadedFrom] = useState<string | null>(null);
  const [id, setId] = useState<string>(idParam || "");

  const [data, setData] = useState<Brief | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // editable criteria (5 columns)
  const [draftCols, setDraftCols] = useState<string[]>([
    "Price",
    "Key feature",
    "Best for",
    "Downside",
    "Notes",
  ]);

  const effectiveCols = useMemo(() => {
    // Always 5, always non-empty strings
    const base = draftCols.slice(0, 5).map((x) => (x ?? "").trim());
    while (base.length < 5) base.push("");
    return base.map((x, idx) => x || `Column ${idx + 1}`);
  }, [draftCols]);

  // Load from Portable param (p=...)
  useEffect(() => {
    if (!pParam) return;
    try {
      const parsed = decodePortable(pParam);
      if (parsed && parsed.query && parsed.columns && parsed.rows) {
        setData(parsed as Brief);
        setStatus("success");
        setErrorMsg(null);
        setLoadedFrom("portable link");
        // sync columns draft
        if (Array.isArray((parsed as any).columns)) {
          const cols = (parsed as any).columns.slice(0, 5);
          while (cols.length < 5) cols.push("");
          setDraftCols(cols);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pParam]);

  // Load from local storage by id
  useEffect(() => {
    if (!idParam) return;
    try {
      const store = readStore();
      const hit = store[idParam];
      if (hit) {
        setData(hit);
        setStatus("success");
        setErrorMsg(null);
        setLoadedFrom(`local storage: ${idParam}`);
        setId(idParam);
        // sync columns draft
        const cols = (hit.columns ?? []).slice(0, 5);
        while (cols.length < 5) cols.push("");
        setDraftCols(cols);
      }
    } catch {
      // ignore
    }
  }, [idParam]);

  // Generate on first visit when nothing loaded
  useEffect(() => {
    // if already loaded from portable/local storage, do nothing
    if (data) return;

    let cancelled = false;

    async function run() {
      setStatus("loading");
      setErrorMsg(null);

      try {
        const result = await fetchBrief({
          query,
          constraints,
          columns: effectiveCols,
        });

        if (cancelled) return;

        const newId = makeId();
        setId(newId);

        const store = readStore();
        store[newId] = result;
        writeStore(store);

        setData(result);
        setStatus("success");
        setLoadedFrom(null);

        // keep URL stable with id
        router.replace(`/brief?id=${encodeURIComponent(newId)}`);
      } catch (err: any) {
        if (cancelled) return;
        setErrorMsg(err?.message ?? "Something went wrong");
        setStatus("error");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, constraints]);

  async function handleRegenerate() {
    setStatus("loading");
    setErrorMsg(null);

    try {
      const result = await fetchBrief({
        query,
        constraints,
        columns: effectiveCols,
      });

      const useId = id || makeId();
      setId(useId);

      const store = readStore();
      store[useId] = result;
      writeStore(store);

      setData(result);
      setStatus("success");
      setLoadedFrom(null);

      router.replace(`/brief?id=${encodeURIComponent(useId)}`);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Something went wrong");
      setStatus("error");
    }
  }

  function handleShareLocal() {
    if (!data || !id) return;
    // local link (id-based)
    const url = `${window.location.origin}/brief?id=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url).catch(() => {});
    alert("Local link copied.");
  }

  function handleSharePortable() {
    if (!data) return;
    // portable payload (works without localStorage)
    const url = `${window.location.origin}/brief?p=${encodePortable(data)}`;
    navigator.clipboard.writeText(url).catch(() => {});
    alert("Portable link copied.");
  }

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Back
          </button>

          <div className="text-sm text-gray-700 font-medium">ClearPick</div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSharePortable}
              className="rounded-xl border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Share (Portable)
            </button>
            <button
              onClick={handleShareLocal}
              className="rounded-xl border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Share (Local)
            </button>
            <button
              onClick={handleRegenerate}
              className="rounded-xl bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-900"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-gray-500">
            Comparison Grid
          </div>

          <h1 className="text-4xl font-semibold leading-tight">{query}</h1>

          <div className="text-gray-600">
            {constraints && constraints !== "None" ? constraints : "No constraints"}
          </div>

          {loadedFrom && (
            <div className="text-sm text-gray-500">Loaded via {loadedFrom}</div>
          )}

          {data?._mode && (
            <div className="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              Demo mode
            </div>
          )}
        </div>

        {/* Loading / Error */}
        {status === "loading" && (
          <section className="mt-8 rounded-2xl border p-6">
            <div className="text-xs uppercase tracking-wider text-gray-500">
              Generating…
            </div>
            <div className="mt-2 text-gray-700">
              Building a clear comparison grid.
            </div>
          </section>
        )}

        {status === "error" && (
          <section className="mt-8 rounded-2xl border p-6 space-y-4">
            <div className="text-xs uppercase tracking-wider text-red-600">
              Error
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {errorMsg}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                className="rounded-xl bg-black px-4 py-2 text-sm text-white"
              >
                Retry
              </button>
              <button
                onClick={() => router.push("/")}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                Back
              </button>
            </div>
          </section>
        )}

        {/* Main content */}
        {status === "success" && data && (
          <div className="mt-10 space-y-8">
            {/* Criteria */}
            <section className="rounded-2xl border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500">
                    Criteria
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Edit the 5 comparison columns, then regenerate.
                  </div>
                </div>

                <button
                  onClick={handleRegenerate}
                  className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
                >
                  Regenerate
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <label key={idx} className="block">
                    <div className="text-xs text-gray-500 mb-1">Column {idx + 1}</div>
                    <input
                      value={draftCols[idx] ?? ""}
                      onChange={(e) => {
                        const next = draftCols.slice();
                        next[idx] = e.target.value;
                        setDraftCols(next);
                      }}
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                      placeholder={`Column ${idx + 1}`}
                    />
                  </label>
                ))}
              </div>
            </section>

            {/* Recommendation */}
            <section className="rounded-2xl border p-6">
              <div className="text-xs uppercase tracking-wider text-gray-500">
                Recommendation
              </div>
              <div className="mt-2 text-2xl font-semibold">{data.topPick.name}</div>
              <p className="mt-2 text-gray-700">{data.topPick.why}</p>
              <p className="mt-2 text-gray-500">
                Trade-off: {data.topPick.tradeoff}
              </p>
            </section>

            {/* Table */}
            <section className="rounded-2xl border p-6">
              <div className="text-xs uppercase tracking-wider text-gray-500">
                Comparison Table
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="py-3 pr-4">Item</th>

                      {data.columns.map((col, idx) => (
                        <th key={`${col}-${idx}`} className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span>{col}</span>
                            <span
                              title={data.columnHelp?.[idx] || ""}
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] text-gray-500"
                            >
                              ?
                            </span>
                          </div>
                        </th>
                      ))}

                      <th className="py-3">Notes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.rows.map((row, rIdx) => (
                      <tr key={`${row.name}-${rIdx}`} className="border-b last:border-b-0">
                        <td className="py-4 pr-4 font-medium">{row.name}</td>

                        {data.columns.map((_, cIdx) => (
                          <td key={`${row.name}-${cIdx}`} className="py-4 pr-4 text-gray-800">
                            {row.values?.[cIdx] ?? ""}
                          </td>
                        ))}

                        <td className="py-4 text-gray-700">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ✅ Sources (this is the part you couldn't find) */}
            <section className="rounded-2xl border p-6 space-y-3">
              <div className="text-xs uppercase tracking-wider text-gray-500">
                Sources
              </div>

              {data.sources.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Demo mode — live sources will appear when API mode is enabled.
                </div>
              ) : (
                <ul className="space-y-2">
                  {data.sources.map((s, i) => (
                    <li key={`${s.url}-${i}`} className="text-sm">
                      <a
                        className="underline text-gray-700 hover:text-black"
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}