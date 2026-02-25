export type Brief = {
  query: string;
  constraints: string;
  topPick: { name: string; why: string; tradeoff: string };
  columns: string[];
  columnHelp: string[];
  rows: { name: string; values: string[]; notes: string }[];
  sources: { title: string; url: string }[];
  _mode?: string;
};

export const STORAGE_KEY = "pickle:v1";

export function readStore(): Record<string, Brief> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeStore(store: Record<string, Brief>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function saveToHistory(brief: Brief): string {
  const store = readStore();
  const id = Date.now().toString(36);
  store[id] = brief;
  writeStore(store);
  return id;
}

export function getRecentItems(limit = 3): { id: string; brief: Brief }[] {
  const store = readStore();
  return Object.entries(store)
    .map(([id, brief]) => ({ id, brief }))
    .reverse()
    .slice(0, limit);
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
