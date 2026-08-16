import { secureGet, safeInt, secureSet, secureGetOrMigrate, legacyNumber } from "./secureStore";

const PLAY_TIME_KEY = "carnival-play-time";
const MAX_PLAY_TIME_SECONDS = 9_999_999; // ~115 days max

/** Total seconds played across all sessions. */
export function getTotalPlayTime(): number {
  return safeInt(secureGetOrMigrate<number>(PLAY_TIME_KEY, 0, legacyNumber), MAX_PLAY_TIME_SECONDS);
}

/** Add seconds to the lifetime play-time total. */
export function addPlayTime(seconds: number): number {
  const next = safeInt(getTotalPlayTime() + Math.max(0, seconds), MAX_PLAY_TIME_SECONDS);
  secureSet(PLAY_TIME_KEY, next);
  return next;
}

/** Format seconds as "HH:MM:SS" (or shorter when under an hour). */
export function formatPlayTime(seconds: number): string {
  const s = Math.max(0, Math.floor(safeInt(seconds, MAX_PLAY_TIME_SECONDS)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [m.toString().padStart(2, "0"), sec.toString().padStart(2, "0")];
  if (h > 0) parts.unshift(h.toString());
  return parts.join(":");
}
