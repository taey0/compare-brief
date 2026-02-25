"use client";

import { useState } from "react";
import { IconChevronRight } from "../components/Icons";
import TabBar from "../components/TabBar";
import { clearHistory } from "../lib/storage";

export default function SettingsPage() {
  const [cleared, setCleared] = useState(false);

  function handleClearHistory() {
    if (cleared) return;
    clearHistory();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  }

  function handleShareApp() {
    const text = "Check out Pickle — compare anything and decide in seconds!\nhttps://compare-brief.vercel.app";
    if (navigator.share) {
      navigator.share({ title: "Pickle", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  return (
    <main className="page-with-tabs">
      <div className="container" style={{ maxWidth: 540, paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
        <div style={{ marginTop: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em" }}>Settings</h1>
        </div>

        {/* App info */}
        <div style={{
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0",
        }}>
          <img src="/favicon.svg" width={48} height={48} alt="" style={{ borderRadius: 12 }} />
          <div style={{
            marginTop: 10,
            fontSize: 18,
            fontWeight: 750,
            letterSpacing: "-0.02em",
          }}>
            Pickle
          </div>
          <div className="text-sm text-muted" style={{ marginTop: 2 }}>
            Pick the best. Skip the rest.
          </div>
          <div className="text-xs text-muted" style={{ marginTop: 4 }}>
            Version 0.1.0
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 16 }}>
          <div className="label" style={{ marginBottom: 8 }}>General</div>
          <div className="card" style={{ overflow: "hidden" }}>
            <button className="settings-row" onClick={handleClearHistory}>
              <span style={{ fontSize: 14, fontWeight: 500, color: cleared ? "var(--primary)" : "var(--fg-secondary)" }}>
                {cleared ? "History cleared" : "Clear history"}
              </span>
              <IconChevronRight />
            </button>
            <button className="settings-row" onClick={handleShareApp}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-secondary)" }}>
                Share Pickle
              </span>
              <IconChevronRight />
            </button>
          </div>
        </div>

        {/* About */}
        <div style={{ marginTop: 24 }}>
          <div className="label" style={{ marginBottom: 8 }}>About</div>
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="settings-row" style={{ cursor: "default" }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-secondary)" }}>
                Powered by AI
              </span>
              <span className="text-xs text-muted">OpenAI</span>
            </div>
            <a
              href="https://github.com/taey0/compare-brief"
              target="_blank"
              rel="noreferrer"
              className="settings-row"
              style={{ textDecoration: "none" }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-secondary)" }}>
                Source code
              </span>
              <IconChevronRight />
            </a>
          </div>
        </div>
      </div>

      <TabBar />
    </main>
  );
}
