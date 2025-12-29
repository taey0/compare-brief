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
};

const STORAGE_KEY = "compare-brief:v1";

function makeId() {
  return (
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36).slice(2, 6)
  );
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function saveBrief(id: string, brief: Brief) {
  const store = readStore();
  store[id] = brief;
  writeStore(store);
}

function loadBrief(id: string): Brief | null {
  const store = readStore();
  return store[id] ?? null;
}

function encodeBrief(brief: Brief): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(brief));
}

function decodeBrief(payload: string): Brief | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(payload);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function fetchBrief(params: {
  query: string;
  constraints: string;
  criteria?: string[] | null;
}): Promise<Brief> {
  const res = await fetch("/api/brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) throw new Error(text || `API Error ${res.status}`);
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but got: ${contentType}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server returned invalid JSON");
  }
}

function normalizeCriteria(list: string[]): string[] {
  const cleaned = list.map((s) => s.trim()).filter(Boolean);
  while (cleaned.length < 5) cleaned.push("Unknown");
  return cleaned.slice(0, 5);
}

function normalizeColumnHelp(list: string[] | undefined): string[] {
  const cleaned = (list ?? []).map((s) => String(s).trim()).filter(Boolean);
  while (cleaned.length < 5) cleaned.push("Why it matters: Unknown");
  return cleaned.slice(0, 5);
}

export default function BriefClient() {
  const router = useRouter();
  const params = useSearchParams();

  const q = (params.get("q") ?? "").trim();
  const c = (params.get("c") ?? "").trim();
  const idParam = (params.get("id") ?? "").trim();
  const dataParam = (params.get("data") ?? "").trim();

  const defaultQuery = "Best noise-cancelling headphones for calls";

  const [data, setData] = useState<Brief | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [copiedLocal, setCopiedLocal] = useState(false);
  const [copiedPortable, setCopiedPortable] = useState(false);

  const [criteriaDraft, setCriteriaDraft] = useState<string[]>(
    Array(5).fill("")
  );
  const [regenLoading, setRegenLoading] = useState(false);

  const displayQuery = useMemo(() => (q || defaultQuery).trim(), [q]);
  const displayConstraints = useMemo(() => (c || "").trim(), [c]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setCopiedLocal(false);
      setCopiedPortable(false);
      setErrorMsg(null);
      setData(null);

      // 1) portable link
      if (dataParam) {
        setStatus("loading");
        const decoded = decodeBrief(dataParam);
        if (decoded) {
          if (cancelled) return;

          const newId = makeId();
          saveBrief(newId, decoded);
          setActiveId(newId);

          setData(decoded);
          setCriteriaDraft(normalizeCriteria(decoded.columns ?? []));
          setStatus("success");
          return;
        } else {
          if (cancelled) return;
          setStatus("error");
          setErrorMsg("This portable link is invalid or corrupted.");
          return;
        }
      }

      // 2) local id link
      if (idParam) {
        setStatus("loading");
        const cached = loadBrief(idParam);
        if (cached) {
          if (cancelled) return;
          setData(cached);
          setActiveId(idParam);
          setCriteriaDraft(normalizeCriteria(cached.columns ?? []));
          setStatus("success");
          return;
        } else {
          if (cancelled) return;
          setActiveId(idParam);
          setStatus("error");
          setErrorMsg(
            "This link uses local storage and was not found on this browser. Use a portable share link instead."
          );
          return;
        }
      }

      // 3) generate from API
      setStatus("loading");
      try {
        const result = await fetchBrief({
          query: displayQuery,
          constraints: displayConstraints,
        });
        if (cancelled) return;

        const newId = makeId();
        saveBrief(newId, result);

        setData(result);
        setActiveId(newId);
        setCriteriaDraft(normalizeCriteria(result.columns ?? []));
        setStatus("success");

        router.replace(`/brief?id=${encodeURIComponent(newId)}`);
      } catch (err: any) {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg(err?.message ?? "Something went wrong");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [dataParam, idParam, displayQuery, displayConstraints, router]);

  async function copyLocalShareLink() {
    if (!activeId) return;
    const url = `${window.location.origin}/brief?id=${encodeURIComponent(activeId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLocal(true);
      setTimeout(() => setCopiedLocal(false), 1200);
    } catch {
      prompt("Copy this link:", url);
    }
  }

  async function copyPortableShareLink() {
    if (!data) return;
    const payload = encodeBrief(data);
    const url = `${window.location.origin}/brief?data=${payload}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPortable(true);
      setTimeout(() => setCopiedPortable(false), 1200);
    } catch {
      prompt("Copy this link:", url);
    }
  }

  async function regenerate() {
    if (!data) return;

    const criteria = normalizeCriteria(criteriaDraft);

    setRegenLoading(true);
    setErrorMsg(null);

    try {
      const result = await fetchBrief({
        query: data.query,
        constraints: data.constraints,
        criteria,
      });

      setData(result);
      setCriteriaDraft(normalizeCriteria(result.columns ?? []));

      const id = activeId ?? makeId();
      setActiveId(id);
      saveBrief(id, result);

      router.replace(`/brief?id=${encodeURIComponent(id)}`);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Failed to regenerate");
      setStatus("error");
    } finally {
      setRegenLoading(false);
    }
  }

  const help = useMemo(() => normalizeColumnHelp(data?.columnHelp), [data]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:underline"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={copyPortableShareLink}
              disabled={!data || status !== "success"}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-black hover:text-white disabled:opacity-50"
              title="Portable share (works for anyone)"
            >
              {copiedPortable ? "Portable Copied!" : "Share (Portable)"}
            </button>

            <button
              onClick={copyLocalShareLink}
              disabled={!activeId || status !== "success"}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-black hover:text-white disabled:opacity-50"
              title="Local share (same browser only)"
            >
              {copiedLocal ? "Local Copied!" : "Share (Local)"}
            </button>
          </div>
        </div>

        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Compare Brief</h1>

          {status === "success" && data && (
            <>
              <p className="text-gray-600">
                Query: <span className="font-medium text-black">{data.query}</span>
              </p>
              {data.constraints && (
                <p className="text-gray-600">
                  Constraints:{" "}
                  <span className="font-medium text-black">{data.constraints}</span>
                </p>
              )}
            </>
          )}

          {dataParam && (
            <p className="text-gray-600">
              Loaded via portable link (works for anyone).
            </p>
          )}

          {idParam && !dataParam && status === "success" && (
            <p className="text-gray-600">
              Loaded via local storage:{" "}
              <span className="font-medium text-black">{idParam}</span>
            </p>
          )}
        </header>

        {status === "loading" && (
          <section className="rounded-2xl border p-5 space-y-2">
            <div className="text-xs uppercase tracking-wider text-gray-500">
              Generating…
            </div>
            <div className="text-gray-700">Building your brief.</div>
          </section>
        )}

        {(status === "error" || errorMsg) && (
          <section className="rounded-2xl border p-5 space-y-2">
            <div className="text-xs uppercase tracking-wider text-red-500">
              Error
            </div>
            <div className="text-gray-700 whitespace-pre-wrap">{errorMsg}</div>
          </section>
        )}

        {status === "success" && data && (
          <>
            <section className="rounded-2xl border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500">
                    Criteria
                  </div>
                  <div className="text-sm text-gray-600">
                    Edit the 5 comparison columns, then regenerate.
                  </div>
                </div>

                <button
                  onClick={regenerate}
                  disabled={regenLoading}
                  className="rounded-xl bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
                >
                  {regenLoading ? "Regenerating…" : "Regenerate"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {criteriaDraft.map((val, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Column {idx + 1}
                    </label>
                    <input
                      value={val}
                      onChange={(e) => {
                        const next = [...criteriaDraft];
                        next[idx] = e.target.value;
                        setCriteriaDraft(next);
                      }}
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="e.g., Battery life"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border p-5 space-y-2">
              <div className="text-xs uppercase tracking-wider text-gray-500">
                Recommendation
              </div>
              <div className="text-lg font-semibold">{data.topPick.name}</div>
              <p className="text-gray-700">{data.topPick.why}</p>
              <p className="text-gray-500">Trade-off: {data.topPick.tradeoff}</p>
            </section>

            <section className="rounded-2xl border p-5 space-y-3">
              <div className="text-xs uppercase tracking-wider text-gray-500">
                Comparison Table
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="py-2 pr-4">Item</th>

                      {data.columns.map((col, idx) => (
                        <th key={`${col}-${idx}`} className="py-2 pr-4">
                          <div className="inline-flex items-center gap-2 relative group">
                            <span>{col}</span>

                            <span
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] text-gray-600"
                              aria-label={`Why ${col} matters`}
                            >
                              ?
                            </span>

                            <div className="pointer-events-none absolute left-0 top-7 z-10 hidden w-64 rounded-xl border bg-white p-3 text-xs text-gray-700 shadow-sm group-hover:block">
                              {help[idx] ?? "Why it matters: Unknown"}
                            </div>
                          </div>
                        </th>
                      ))}

                      <th className="py-2">Notes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.name} className="border-b last:border-b-0">
                        <td className="py-3 pr-4 font-medium">{row.name}</td>

                        {data.columns.map((_, idx) => (
                          <td key={idx} className="py-3 pr-4">
                            {row.values?.[idx] ?? "Unknown"}
                          </td>
                        ))}

                        <td className="py-3">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border p-5 space-y-3">
              <div className="text-xs uppercase tracking-wider text-gray-500">
                Sources
              </div>
              <ul className="space-y-2">
                {data.sources.map((s) => (
                  <li key={`${s.title}-${s.url}`} className="text-sm">
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
            </section>
          </>
        )}
      </div>
    </main>
  );
}