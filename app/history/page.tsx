"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconHistory, IconTrash } from "../components/Icons";
import TabBar from "../components/TabBar";
import { type Brief, readStore, writeStore } from "../lib/storage";

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<{ id: string; brief: Brief }[]>([]);

  useEffect(() => {
    const store = readStore();
    const list = Object.entries(store).map(([id, brief]) => ({ id, brief }));
    setItems(list.reverse());
  }, []);

  function remove(id: string) {
    const store = readStore();
    delete store[id];
    writeStore(store);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <main className="page-with-tabs">
      <div className="container" style={{ maxWidth: 540, paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
        <div style={{ marginTop: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em" }}>History</h1>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <IconHistory />
            <p className="text-sm text-muted" style={{ marginTop: 8 }}>
              No saved comparisons yet.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => router.push("/")}
              style={{ marginTop: 12 }}
            >
              Start comparing
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map(({ id, brief }) => (
              <div
                key={id}
                className="card"
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                }}
                onClick={() => router.push(`/brief?id=${id}`)}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--primary-weak)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 14, color: "var(--primary)", fontWeight: 700 }}>
                    {brief.rows?.length ?? 0}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="h3" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {brief.query}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: 1 }}>
                    Top: {brief.topPick?.name ?? "—"}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(id);
                  }}
                  style={{ color: "var(--muted)", padding: "0 6px" }}
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <TabBar />
    </main>
  );
}
