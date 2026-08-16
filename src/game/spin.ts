import { secureGet, secureSet, safeInt } from "./secureStore";
import { getBank, setBank } from "./shop";
import { dayKey } from "./daily";

const LAST_FREE = "carnival-spin-last-free";
const TOTAL = "carnival-spin-total";
const WON = "carnival-spin-won";

/** Price of an extra spin once the free daily one is used. */
export const SPIN_COST = 750;

export interface Wedge {
  label: string;
  coins: number;
  weight: number;
  color: string;
}

/** Wheel layout — order here is the order drawn clockwise. */
export const WEDGES: Wedge[] = [
  { label: "25", coins: 25, weight: 28, color: "#ff5da2" },
  { label: "60", coins: 60, weight: 22, color: "#4dd2ff" },
  { label: "15", coins: 15, weight: 26, color: "#8bff5a" },
  { label: "120", coins: 120, weight: 12, color: "#ffd93d" },
  { label: "40", coins: 40, weight: 20, color: "#b794ff" },
  { label: "250", coins: 250, weight: 5, color: "#ff8a3d" },
  { label: "20", coins: 20, weight: 26, color: "#5ad1a5" },
  { label: "600", coins: 600, weight: 1, color: "#ff3b5c" },
];

export interface SpinState {
  freeAvailable: boolean;
  bank: number;
  cost: number;
  totalSpins: number;
  totalWon: number;
  msUntilFree: number;
}

export function getSpinState(): SpinState {
  const last = secureGet<string>(LAST_FREE, "");
  const freeAvailable = last !== dayKey();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return {
    freeAvailable,
    bank: getBank(),
    cost: SPIN_COST,
    totalSpins: safeInt(secureGet<number>(TOTAL, 0), 999_999),
    totalWon: safeInt(secureGet<number>(WON, 0), 99_999_999),
    msUntilFree: freeAvailable ? 0 : Math.max(0, midnight.getTime() - Date.now()),
  };
}

const pickIndex = (): number => {
  const total = WEDGES.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < WEDGES.length; i++) {
    roll -= WEDGES[i]!.weight;
    if (roll <= 0) return i;
  }
  return WEDGES.length - 1;
};

export interface SpinResult {
  ok: boolean;
  reason?: "cooldown-paid" | "no-coins";
  index: number;
  coins: number;
  usedFree: boolean;
  bank: number;
}

/**
 * Resolves one spin. The free daily spin is used first; after that a spin
 * costs SPIN_COST coins, which are debited before the payout is credited.
 */
export function spin(): SpinResult {
  const state = getSpinState();
  const usedFree = state.freeAvailable;
  if (!usedFree && state.bank < SPIN_COST) {
    return { ok: false, reason: "no-coins", index: -1, coins: 0, usedFree: false, bank: state.bank };
  }

  if (usedFree) secureSet(LAST_FREE, dayKey());
  else setBank(getBank() - SPIN_COST);

  const index = pickIndex();
  const coins = WEDGES[index]!.coins;
  setBank(getBank() + coins);
  secureSet(TOTAL, state.totalSpins + 1);
  secureSet(WON, state.totalWon + coins);

  return { ok: true, index, coins, usedFree, bank: getBank() };
}
