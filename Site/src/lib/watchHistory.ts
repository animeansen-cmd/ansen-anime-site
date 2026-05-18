export interface WatchHistoryEntry {
  animeSlug: string;
  animeTitle: string;
  episodeNumber: number;
  episodeTitle: string;
  thumbnail: string;
  cover: string;
  language: string;
  visitedAt: string;
}

const WATCH_HISTORY_KEY = "ansen_watch_history";
const WATCH_HISTORY_LIMIT = 12;

function isBrowser() {
  return typeof window !== "undefined";
}

export function readWatchHistory(): WatchHistoryEntry[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(WATCH_HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry): entry is WatchHistoryEntry => (
        Boolean(entry) &&
        typeof entry.animeSlug === "string" &&
        typeof entry.animeTitle === "string" &&
        typeof entry.episodeNumber === "number" &&
        typeof entry.episodeTitle === "string"
      ))
      .sort((left, right) => Date.parse(right.visitedAt) - Date.parse(left.visitedAt));
  } catch {
    return [];
  }
}

export function pushWatchHistory(entry: Omit<WatchHistoryEntry, "visitedAt">) {
  if (!isBrowser()) return;

  const payload: WatchHistoryEntry = {
    ...entry,
    visitedAt: new Date().toISOString(),
  };

  const existing = readWatchHistory().filter(
    (item) => !(item.animeSlug === payload.animeSlug && item.episodeNumber === payload.episodeNumber),
  );

  const next = [payload, ...existing].slice(0, WATCH_HISTORY_LIMIT);
  window.localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(next));
}
