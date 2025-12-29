"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [constraints, setConstraints] = useState("");

  function go() {
    const q = query.trim();
    const c = constraints.trim();

    if (!q) return;

    const url = `/brief?q=${encodeURIComponent(q)}&c=${encodeURIComponent(c)}`;
    router.push(url);
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Search → Compare Brief</h1>
          <p className="text-gray-600">
            Type a query and (optionally) constraints. Get a clean recommendation +
            comparison table + sources.
          </p>
        </header>

        <section className="rounded-2xl border p-5 space-y-3">
          <label className="block text-xs uppercase tracking-wider text-gray-500">
            Query
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g., "best wireless earbuds for calls"'
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
            onKeyDown={(e) => {
              if (e.key === "Enter") go();
            }}
          />

          <label className="block text-xs uppercase tracking-wider text-gray-500 mt-2">
            Constraints (optional)
          </label>
          <textarea
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder='e.g., "Under $120, strong mic, comfortable for small ears"'
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
            rows={3}
          />

          <button
            onClick={go}
            className="mt-2 w-full rounded-xl bg-black text-white px-4 py-3 text-sm"
          >
            Generate Brief
          </button>

          <p className="text-xs text-gray-500">
            Tip: Korean queries are fine. The UI output stays in English.
          </p>
        </section>
      </div>
    </main>
  );
}