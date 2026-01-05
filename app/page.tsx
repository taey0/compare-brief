"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function go() {
    const query = q.trim();
    if (!query) return;
    router.push(`/brief?q=${encodeURIComponent(query)}`);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
        <header className="space-y-3">
          <div className="text-sm font-medium tracking-wide uppercase text-gray-500">
            ClearPick
          </div>
          <h1 className="text-4xl font-semibold text-gray-900">
            Compare faster. Decide clearer.
          </h1>
          <p className="text-base text-gray-600">
            Type any question and get a clean comparison grid.
          </p>
        </header>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <label className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Your question</div>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder='e.g. "Best phone plan for international students"'
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") go();
              }}
            />
          </label>

          <button
            onClick={go}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Generate comparison
          </button>

          <p className="text-xs text-gray-400">
            Tip: Add constraints later (budget, size, must-have features).
          </p>
        </div>
      </div>
    </main>
  );
}