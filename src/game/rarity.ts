export type Rarity = "common" | "rare" | "epic" | "legendary";

/** Rarity is derived purely from ticket price — presentation only. */
export function rarityOf(cost: number): Rarity {
  if (cost <= 0) return "common";
  if (cost <= 900) return "rare";
  if (cost <= 2200) return "epic";
  return "legendary";
}

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "COMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
};
