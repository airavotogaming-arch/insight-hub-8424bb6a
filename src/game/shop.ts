import {
  secureGet,
  secureSet,
  safeInt,
  secureGetOrMigrate,
  legacyNumber,
  legacyJson,
} from "./secureStore";

export type CrosshairStyle =
  | "classic"
  | "sniper"
  | "duplex"
  | "dotscope"
  | "xcross"
  | "fine";

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  color: string;
  hex: number;
  style: CrosshairStyle;
  blurb: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "classic", name: "Classic Ring", cost: 0, color: "#ff3b5c", hex: 0xff3b5c, style: "classic", blurb: "Ring + cross" },
  { id: "lime", name: "Mil-Dot Sniper", cost: 250, color: "#8bff5a", hex: 0x8bff5a, style: "sniper", blurb: "Graduated arms" },
  { id: "ice", name: "Duplex Scope", cost: 600, color: "#4dd2ff", hex: 0x4dd2ff, style: "duplex", blurb: "Thick tapered" },
  { id: "gold", name: "Dot Scope", cost: 1200, color: "#ffd93d", hex: 0xffd93d, style: "dotscope", blurb: "Twin rings" },
  { id: "violet", name: "X-Lock", cost: 2200, color: "#b794ff", hex: 0xb794ff, style: "xcross", blurb: "Diagonal cross" },
  { id: "candy", name: "Fine Line", cost: 4000, color: "#ff5da2", hex: 0xff5da2, style: "fine", blurb: "Hairline precision" },
];


export interface ScoreEntry {
  name: string;
  score: number;
}

const BANK = "carnival-bank";
const OWNED = "carnival-owned";
const EQUIPPED = "carnival-equipped";
const BOARD = "carnival-board";

/** Hard ceilings so a forged (or corrupted) value can never become absurd. */
const MAX_BANK = 9_999_999;
const MAX_SCORE = 99_999_999;

export const getBank = () =>
  safeInt(secureGetOrMigrate<number>(BANK, 0, legacyNumber), MAX_BANK);
export const setBank = (v: number) => secureSet(BANK, safeInt(v, MAX_BANK));

const knownIds = (ids: string[], valid: Set<string>) =>
  ids.filter((id) => typeof id === "string" && valid.has(id));

const CROSSHAIR_IDS = new Set(SHOP_ITEMS.map((i) => i.id));

export const getOwned = (): string[] => {
  const owned = knownIds(secureGetOrMigrate<string[]>(OWNED, [], legacyJson), CROSSHAIR_IDS);
  return owned.includes("classic") ? owned : ["classic", ...owned];
};
export const addOwned = (id: string) => secureSet(OWNED, [...new Set([...getOwned(), id])]);

export const getEquipped = () => {
  const id = secureGet<string>(EQUIPPED, "classic");
  return CROSSHAIR_IDS.has(id) ? id : "classic";
};
export const setEquipped = (id: string) => secureSet(EQUIPPED, id);

export const getBoard = (): ScoreEntry[] =>
  secureGetOrMigrate<ScoreEntry[]>(BOARD, [], legacyJson)
    .filter((e) => e && typeof e.name === "string")
    .map((e) => ({ name: e.name.slice(0, 14).toUpperCase(), score: safeInt(e.score, MAX_SCORE) }))
    .slice(0, 5);

export const saveScore = (name: string, score: number): ScoreEntry[] => {
  const clean = name.trim().slice(0, 14).toUpperCase();
  if (!clean) return getBoard();
  const next = [...getBoard(), { name: clean, score: safeInt(score, MAX_SCORE) }]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  secureSet(BOARD, next);
  return next;
};

/** Re-tags this player's saved scores when they rename themselves. */
export const renameBoardEntries = (from: string, to: string): ScoreEntry[] => {
  const oldName = from.trim().slice(0, 14).toUpperCase();
  const newName = to.trim().slice(0, 14).toUpperCase();
  const board = getBoard();
  if (!newName) return board;
  // entries with no owner (or the old name) belong to this local player
  const next = board.map((e) => (!oldName || e.name === oldName ? { ...e, name: newName } : e));
  secureSet(BOARD, next);
  return next;
};



/* ---------- gun skins ---------- */
const GUNS_OWNED = "carnival-guns-owned";
const GUN_EQUIPPED = "carnival-gun";

export const getOwnedGuns = (): string[] => {
  const owned = secureGetOrMigrate<string[]>(GUNS_OWNED, [], legacyJson).filter((id) => typeof id === "string");
  return owned.includes("carnival") ? owned : ["carnival", ...owned];
};
export const addOwnedGun = (id: string) =>
  secureSet(GUNS_OWNED, [...new Set([...getOwnedGuns(), id])]);
export const getEquippedGun = () => secureGet<string>(GUN_EQUIPPED, "carnival") || "carnival";
export const setEquippedGun = (id: string) => secureSet(GUN_EQUIPPED, id);

/* ---------- player profile ---------- */
const PLAYER_NAME = "carnival-player-name";
const MAX_LEVEL = "carnival-max-level";

export const getPlayerName = (): string => {
  const n = secureGet<string>(PLAYER_NAME, "");
  return typeof n === "string" ? n.slice(0, 14) : "";
};
export const setPlayerName = (name: string) => secureSet(PLAYER_NAME, name.trim().slice(0, 14));

export const getMaxLevel = () => Math.max(1, safeInt(secureGet<number>(MAX_LEVEL, 1), 999));
export const setMaxLevel = (v: number) => secureSet(MAX_LEVEL, Math.max(1, safeInt(v, 999)));

/* ---------- match history ---------- */
export interface MatchEntry {
  name: string;
  score: number;
  level: number;
  at: number; // epoch ms
  dur?: number; // round duration in seconds
}

const HISTORY = "carnival-history";
const PLAYED = "carnival-matches-played";
const MAX_HISTORY = 25;

export const getHistory = (): MatchEntry[] =>
  secureGetOrMigrate<MatchEntry[]>(HISTORY, [], legacyJson)
    .filter((e) => e && typeof e === "object")
    .map((e) => ({
      name: typeof e.name === "string" ? e.name.slice(0, 14).toUpperCase() : "",
      score: safeInt(e.score, MAX_SCORE),
      level: Math.max(1, safeInt(e.level, 999)),
      at: safeInt(e.at),
      dur: Math.max(0, safeInt(e.dur ?? 0, 99_999)),
    }))
    .slice(0, MAX_HISTORY);

/** Lifetime count of finished matches (history itself is trimmed to 25). */
export const getMatchesPlayed = () =>
  Math.max(safeInt(secureGet<number>(PLAYED, 0), 999_999), getHistory().length);

export const addMatch = (
  name: string,
  score: number,
  level: number,
  dur = 0,
): MatchEntry[] => {
  secureSet(PLAYED, getMatchesPlayed() + 1);
  const entry: MatchEntry = {
    name: name.trim().slice(0, 14).toUpperCase(),
    score: safeInt(score, MAX_SCORE),
    level: Math.max(1, safeInt(level, 999)),
    at: Date.now(),
    dur: Math.max(0, safeInt(dur, 99_999)),
  };
  const next = [entry, ...getHistory()].slice(0, MAX_HISTORY);
  secureSet(HISTORY, next);
  return next;
};

/** Keeps history attached to the player after a rename. */
export const renameHistoryEntries = (from: string, to: string): MatchEntry[] => {
  const oldName = from.trim().slice(0, 14).toUpperCase();
  const newName = to.trim().slice(0, 14).toUpperCase();
  const hist = getHistory();
  if (!newName) return hist;
  const next = hist.map((e) => (!oldName || e.name === oldName ? { ...e, name: newName } : e));
  secureSet(HISTORY, next);
  return next;
};

/* ---------- speed board (ranked by fastest run) ---------- */
export interface SpeedEntry {
  name: string;
  dur: number; // seconds
  level: number;
  score: number;
}

/**
 * Best (fastest) full-game clear per player, ordered fastest-first.
 * Only runs that cleared every level are stored with a duration.
 */
export const getSpeedBoard = (limit = 10): SpeedEntry[] => {
  const best = new Map<string, SpeedEntry>();
  for (const m of getHistory()) {
    const dur = Math.max(0, safeInt(m.dur ?? 0, 99_999));
    if (!m.name || dur <= 0) continue;
    const prev = best.get(m.name);
    const better = !prev || dur < prev.dur;
    if (better) best.set(m.name, { name: m.name, dur, level: m.level, score: m.score });
  }
  return [...best.values()]
    .sort((a, b) => a.dur - b.dur || b.score - a.score)
    .slice(0, limit);
};

/** Formats a run duration as M:SS (or H:MM:SS). */
export const formatDuration = (seconds: number): string => {
  const s = Math.max(0, Math.floor(safeInt(seconds, 99_999)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};
