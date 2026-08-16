import { secureGet, secureSet, safeInt } from "./secureStore";

const DIAMONDS = "carnival-diamonds";
const ADS_WATCHED = "carnival-diamond-ads";

const MAX_DIAMONDS = 99_999;

/** Diamonds granted for each completed rewarded ad. */
export const DIAMONDS_PER_AD = 3;

export const getDiamonds = () => safeInt(secureGet<number>(DIAMONDS, 0), MAX_DIAMONDS);
export const setDiamonds = (v: number) => secureSet(DIAMONDS, safeInt(v, MAX_DIAMONDS));

export const getAdsWatched = () => safeInt(secureGet<number>(ADS_WATCHED, 0), 999_999);

/** Credits diamonds after a finished rewarded ad. Returns the new balance. */
export function grantAdDiamonds(count = DIAMONDS_PER_AD): number {
  setDiamonds(getDiamonds() + Math.max(1, safeInt(count, 100)));
  secureSet(ADS_WATCHED, getAdsWatched() + 1);
  return getDiamonds();
}

/** Diamond price for an item, derived from its ticket cost. */
export const diamondCost = (ticketCost: number): number =>
  ticketCost <= 0 ? 0 : (Math.ceil(ticketCost / 1500) + 1) * 10;

/** Spends diamonds if the balance allows it. */
export function spendDiamonds(amount: number): boolean {
  const cost = Math.max(0, safeInt(amount, MAX_DIAMONDS));
  if (getDiamonds() < cost) return false;
  setDiamonds(getDiamonds() - cost);
  return true;
}
