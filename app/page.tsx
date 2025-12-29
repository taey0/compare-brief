"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const SUGGESTIONS = [
  "Best phone plan for international students",
  "Best noise-cancelling headphones for calls",
  "Best credit card for students (no annual fee)",
  "Best laptop for design students under $1500",
  "Best probiotic for constipation (gentle + effective)",
];

export default function HomePage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [constraints, setConstraints] = useState("");

  const canGo = useMemo(() => query.trim().length > 2, [query]);

  function go() {
    const q = query.trim();
    if (!q) return;

    const url =
      constraints.trim().length > 0
        ? `/brief?q=${encodeURIComponent(q)}&c=${encodeURIComponent(
            constraints.trim()
          )}`
        : `/brief?q=${encodeURIComponent(q)}`;

    router.push(url);
  }

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="text-sm font-semibold tracking-tight">ClearPick</div>
          <div className="text-xs text-gray-500">Turn a question into a clear comparison grid</div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Hero */}
        <section className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Make choices faster.
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Type what you’re trying to buy or decide. ClearPick generates a comparison grid + a top
            recommendation with sources.
          </p>
        </section>

        {/* Search card */}
        <section className="rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">What are you comparing?</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") go();
              }}
              placeholder='e.g. "Best phone plan for international students"'
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Constraints <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") go();
              }}
              placeholder='e.g. "Under $50, available in the US, good warranty"'
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <button
            onClick={go}
            disabled={!canGo}
            className="w-full rounded-xl bg-black px-4 py-3 text-white text-base disabled:opacity-40"
          >
            Generate comparison
          </button>

          <div className="pt-2">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              Try examples
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="text-sm font-semibold">Clear grid</div>
            <p className="text-sm text-gray-600 mt-1">
              Consistent criteria + side-by-side comparison.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="text-sm font-semibold">Top pick</div>
            <p className="text-sm text-gray-600 mt-1">
              A recommendation + trade-off so it feels honest.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="text-sm font-semibold">Shareable</div>
            <p className="text-sm text-gray-600 mt-1">
              One link you can send to anyone.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-xs text-gray-400 pt-4">
          ClearPick is a prototype. Always verify details before purchasing.
        </footer>
      </div>
    </main>
  );
}