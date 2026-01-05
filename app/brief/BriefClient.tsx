"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LZString from "lz-string";

type Source = { title: string; url: string };

type Brief = {
  query: string;
  constraints: string;
  topPick: { name: string; why: string; tradeoff: string };
  columns: string[]; // (예: Price, Data, eSIM...)
  columnHelp: string[]; // 각 컬럼 도움말 (없으면 빈 문자열)
  rows: { name: string; values: string[]; notes: string }[];
  sources: Source[];
  _mode?: string; // demo_* 등
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

async function fetchBrief(input: {
  query: string;
  constraints: string;
  columns: string[];
}): Promise<Brief> {
  const res = await fetch("/api/brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
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

export default function BriefClient() {
  const router = useRouter();
  const params = useSearchParams();

  const qParam = (params.get("q") ?? "").trim();
  const cParam = (params.get("c") ?? "").trim();
  const idParam = (params.get("id") ?? "").trim();

  const defaultQuery = "Best noise cancelling headphones for calls";

  const [data, setData] = useState<Brief | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 5개 컬럼 편집 UI (원하면 나중에 개수 변경 가능)
  const [col1, setCol1] = useState("Price");
  const [col2, setCol2] = useState("Key feature");
  const [col3, setCol3] = useState("Best for");
  const [col4, setCol4] = useState("Downside");
  const [col5, setCol5] = useState("Notes");

  const columns = useMemo(() => [col1, col2, col3, col4, col5].map((s) => s.trim()), [col1, col2, col3, col4, col5]);

  const query = qParam || defaultQuery;
  const constraints = cParam || "";

  // Load: 1) id 기반(localStorage) 우선 → 없으면 API 생성
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus("loading");
      setErrorMsg(null);

      try {
        if (idParam) {
          const store = readStore();
          const cached = store[idParam];
          if (cached) {
            if (cancelled) return;
            setData(cached);
            setStatus("success");
            return;
          }
        }

        const result = await fetchBrief({ query, constraints, columns });
        if (cancelled) return;

        setData(result);
        setStatus("success");

        // 자동 저장(로컬 공유용)
        const id = idParam || makeId();
        const store = readStore();
        store[id] = result;
        writeStore(store);

        // URL에 id 유지(새로고침/공유 안정)
        if (!idParam) {
          const next = new URLSearchParams(params.toString());
          next.set("id", id);
          router.replace(`/brief?${next.toString()}`);
        }
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
  }, [query, constraints, idParam]);

  function onRegenerate() {
    const next = new URLSearchParams(params.toString());
    next.set("q", query);
    if (constraints) next.set("c", constraints);
    // id를 유지해도 되지만, 결과 새로 만들 때는 새 id로 저장되는 편이 관리 쉬움
    next.delete("id");
    router.push(`/brief?${next.toString()}`);
  }

  function onShareLocal() {
    // 현재 URL 그대로 복사 (id 포함이면 로컬스토리지 기반 공유)
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied (local).");
  }

  function onSharePortable() {
    // data를 URL에 압축해서 담기 (기기/브라우저 달라도 열리게)
    if (!data) return;
    const payload = JSON.stringify(data);
    const compressed = LZString.compressToEncodedURIComponent(payload);

    const base = `${window.location.origin}/brief`;
    const url = `${base}?p=${compressed}`;
    navigator.clipboard.writeText(url);
    alert("Link copied (portable).");
  }

  // portable 링크(p=...) 열었을 때
  useEffect(() => {
    const p = (params.get("p") ?? "").trim();
    if (!p) return;

    try {
      const json = LZString.decompressFromEncodedURIComponent(p);
      if (!json) return;
      const parsed = JSON.parse(json) as Brief;
      setData(parsed);
      setStatus("success");
      setErrorMsg(null);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>

          <div className="text-sm font-semibold text-gray-900">ClearPick</div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSharePortable}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Share
            </button>
            <button
              onClick={onRegenerate}
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        {/* Header */}
        <header className="space-y-3">
          <div className="text-sm font-medium tracking-wide uppercase text-gray-500">
            Comparison Grid
          </div>

          <h1 className="text-3xl font-semibold text-gray-900">{query}</h1>

          <p className="text-sm text-gray-500">
            {constraints ? `Constraints: ${constraints}` : "No constraints"}
          </p>

          {data?._mode && (
            <p className="text-xs text-gray-400">Mode: {data._mode}</p>
          )}
        </header>

        {/* Criteria */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium tracking-wide uppercase text-gray-500">
                Criteria
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Edit columns to fit your question, then regenerate.
              </p>
            </div>

            <button
              onClick={onRegenerate}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Regenerate
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2">
              <div className="text-xs font-medium text-gray-500">Column 1</div>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={col1}
                onChange={(e) => setCol1(e.target.value)}
              />
            </label>

            <label className="space-y-2">
              <div className="text-xs font-medium text-gray-500">Column 2</div>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={col2}
                onChange={(e) => setCol2(e.target.value)}
              />
            </label>

            <label className="space-y-2">
              <div className="text-xs font-medium text-gray-500">Column 3</div>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={col3}
                onChange={(e) => setCol3(e.target.value)}
              />
            </label>

            <label className="space-y-2">
              <div className="text-xs font-medium text-gray-500">Column 4</div>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={col4}
                onChange={(e) => setCol4(e.target.value)}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <div className="text-xs font-medium text-gray-500">Column 5</div>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={col5}
                onChange={(e) => setCol5(e.target.value)}
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onShareLocal}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Share (local)
            </button>

            <div className="text-xs text-gray-400">
              Tip: Portable share works across devices.
            </div>
          </div>
        </section>

        {/* States */}
        {status === "loading" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2">
            <div className="text-sm font-medium tracking-wide uppercase text-gray-500">
              Generating
            </div>
            <p className="text-sm text-gray-600">Building a clean comparison grid…</p>
          </section>
        )}

        {status === "error" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="text-sm font-medium tracking-wide uppercase text-red-600">
              Error
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {errorMsg || "Failed to generate brief"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onRegenerate}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                Retry
              </button>
              <button
                onClick={() => router.push("/")}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </section>
        )}

        {/* Content */}
        {status === "success" && data && (
          <>
            {/* Recommendation */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
              <div className="text-sm font-medium tracking-wide uppercase text-gray-500">
                Recommendation
              </div>

              <div className="text-xl font-semibold text-gray-900">
                {data.topPick?.name || "Top pick"}
              </div>

              <p className="text-base text-gray-800">
                {data.topPick?.why || "Clear reason."}
              </p>

              <p className="text-sm text-gray-500">
                Trade-off: {data.topPick?.tradeoff || "—"}
              </p>
            </section>

            {/* Table */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-medium tracking-wide uppercase text-gray-500">
                    Comparison
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Short, scannable values. “—” means unknown.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="py-3 text-left font-medium pr-4">Item</th>

                      {data.columns.map((col, idx) => (
                        <th key={`${col}-${idx}`} className="py-3 text-left font-medium pr-4">
                          {col}
                        </th>
                      ))}

                      <th className="py-3 text-left font-medium">Notes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.rows.map((row, rIdx) => (
                      <tr key={`${row.name}-${rIdx}`} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium text-gray-900 whitespace-nowrap">
                          {row.name}
                        </td>

                        {data.columns.map((_, cIdx) => (
                          <td key={`${row.name}-${cIdx}`} className="py-3 pr-4 text-gray-800">
                            {(row.values?.[cIdx] ?? "").trim() || "—"}
                          </td>
                        ))}

                        <td className="py-3 text-gray-500">
                          {(row.notes ?? "").trim() || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Sources */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
              <div className="text-sm font-medium tracking-wide uppercase text-gray-500">
                Sources
              </div>

              {data.sources?.length ? (
                <ul className="space-y-2">
                  {data.sources.map((s, idx) => (
                    <li key={`${s.url}-${idx}`} className="text-sm">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 hover:text-blue-900 underline underline-offset-2"
                      >
                        {s.title || s.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No sources provided.</p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}