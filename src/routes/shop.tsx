import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ModelViewer } from "@/components/ModelViewer";
import { GUN_ITEMS } from "@/game/guns";
import { RARITY_LABEL, rarityOf } from "@/game/rarity";
import { DIAMONDS_PER_AD, diamondCost, getDiamonds, grantAdDiamonds, spendDiamonds } from "@/game/diamonds";
import { canShowRewarded, markRewardedShown } from "@/lib/adConfig";
import { showRewarded } from "@/lib/playgama";
import {
  SHOP_ITEMS,
  addOwned,
  addOwnedGun,
  getBank,
  getEquipped,
  getEquippedGun,
  getOwned,
  getOwnedGuns,
  setBank,
  setEquipped,
  setEquippedGun,
} from "@/game/shop";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Prize Shop — Rotate 3D Blasters & Crosshairs | Toy Blitz" },
      {
        name: "description",
        content:
          "Browse the Toy Blitz prize shop in 3D: spin every premium blaster and crosshair, compare ticket prices and equip your favourite loadout.",
      },
      { property: "og:title", content: "Prize Shop — Rotate 3D Blasters & Crosshairs" },
      {
        property: "og:description",
        content: "Interactive 3D previews of every carnival blaster and reticle in Toy Blitz.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

type Tab = "gun" | "crosshair";

const RARITY_HEX: Record<string, string> = {
  common: "#9fb2d8",
  rare: "#4dd2ff",
  epic: "#c07bff",
  legendary: "#ffb028",
};

function ShopPage() {
  const [tab, setTab] = useState<Tab>("gun");
  const [bank, setBankState] = useState(0);
  const [owned, setOwned] = useState<string[]>(["classic"]);
  const [ownedGuns, setOwnedGunsState] = useState<string[]>(["carnival"]);
  const [crosshair, setCrosshair] = useState("classic");
  const [gun, setGun] = useState("carnival");
  const [selGun, setSelGun] = useState("carnival");
  const [selCross, setSelCross] = useState("classic");
  const [gems, setGems] = useState(0);
  const [adBusy, setAdBusy] = useState(false);

  useEffect(() => {
    setBankState(getBank());
    setOwned(getOwned());
    setOwnedGunsState(getOwnedGuns());
    setCrosshair(getEquipped());
    setGun(getEquippedGun());
    setSelGun(getEquippedGun());
    setSelCross(getEquipped());
    setGems(getDiamonds());
  }, []);

  const isGun = tab === "gun";
  const items = isGun ? GUN_ITEMS : SHOP_ITEMS;
  const selectedId = isGun ? selGun : selCross;
  const selected = items.find((i) => i.id === selectedId) ?? items[0]!;
  const ownedIds = isGun ? ownedGuns : owned;
  const equippedId = isGun ? gun : crosshair;
  const isOwned = ownedIds.includes(selected.id);
  const isEquipped = equippedId === selected.id;
  const short = selected.cost - bank;
  const rarity = rarityOf(selected.cost);
  const gemPrice = diamondCost(selected.cost);
  const canGemBuy = !isOwned && gemPrice > 0 && gems >= gemPrice;

  const unlock = (id: string) => {
    if (isGun) {
      addOwnedGun(id);
      setOwnedGunsState(getOwnedGuns());
    } else {
      addOwned(id);
      setOwned(getOwned());
    }
    equip(id);
  };

  const buyWithGems = () => {
    if (isOwned || gemPrice <= 0) return;
    if (!spendDiamonds(gemPrice)) return;
    setGems(getDiamonds());
    unlock(selected.id);
  };

  const watchAdForGems = () => {
    if (adBusy || !canShowRewarded()) return;
    setAdBusy(true);
    markRewardedShown();
    void showRewarded()
      .then((rewarded) => {
        if (rewarded) {
          grantAdDiamonds();
          setGems(getDiamonds());
        }
      })
      .finally(() => setAdBusy(false));
  };

  const equip = (id: string) => {
    if (isGun) {
      setEquippedGun(id);
      setGun(id);
    } else {
      setEquipped(id);
      setCrosshair(id);
    }
  };

  const act = () => {
    if (isOwned) {
      equip(selected.id);
      return;
    }
    if (bank < selected.cost) return;
    const next = bank - selected.cost;
    setBank(next);
    setBankState(next);
    if (isGun) {
      addOwnedGun(selected.id);
      setOwnedGunsState(getOwnedGuns());
    } else {
      addOwned(selected.id);
      setOwned(getOwned());
    }
    equip(selected.id);
  };

  return (
    <main className="armory">
      <div className="armory-inner">
        <header className="armory-head">
          <div>
            <p className="armory-eyebrow">TICKET EXCHANGE</p>
            <h1 className="armory-title">PRIZE SHOP</h1>
          </div>
          <div className="armory-chips">
            <div className="armory-chip">
              <strong>{bank.toLocaleString()}</strong>
              <span>TICKETS</span>
            </div>
            <div className="armory-chip">
              <strong>{gems.toLocaleString()} 💎</strong>
              <span>DIAMONDS</span>
            </div>
            <div className="armory-chip">
              <strong>
                {ownedGuns.length}/{GUN_ITEMS.length}
              </strong>
              <span>BLASTERS</span>
            </div>
            <div className="armory-chip">
              <strong>
                {owned.length}/{SHOP_ITEMS.length}
              </strong>
              <span>SIGHTS</span>
            </div>
            <Link to="/" className="armory-back">
              ← BACK
            </Link>
          </div>
        </header>

        <div className="armory-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={isGun}
            className={`armory-tab ${isGun ? "is-on" : ""}`}
            onClick={() => setTab("gun")}
          >
            BLASTERS
          </button>
          <button
            role="tab"
            aria-selected={!isGun}
            className={`armory-tab ${!isGun ? "is-on" : ""}`}
            onClick={() => setTab("crosshair")}
          >
            CROSSHAIRS
          </button>
        </div>

        <div className="armory-body">
          <section className="armory-stage" style={{ ["--rar" as string]: RARITY_HEX[rarity] }}>
            <div className="armory-stage-holo">
              <span className="armory-rarity">{RARITY_LABEL[rarity]}</span>
              <ModelViewer
                key={`${tab}-${selected.id}`}
                kind={isGun ? "gun" : "crosshair"}
                itemId={selected.id}
                className="model-viewer"
              />
              <span className="armory-beam" />
            </div>
            <div className="armory-stage-info">
              <h2 className="armory-name">{selected.name}</h2>
              <p className="armory-blurb">{selected.blurb}</p>
              <p className="armory-hint">DRAG TO ROTATE · SCROLL TO ZOOM</p>
              <button className="armory-cta" disabled={!isOwned && bank < selected.cost} onClick={act}>
                {isEquipped ? "EQUIPPED" : isOwned ? "EQUIP" : `BUY · ${selected.cost.toLocaleString()} 🎟`}
              </button>
              {!isOwned && gemPrice > 0 && (
                <button className="armory-cta gem" disabled={!canGemBuy} onClick={buyWithGems}>
                  BUY · {gemPrice} 💎
                </button>
              )}
              {!isOwned && (
                <button className="armory-cta ghost" disabled={adBusy} onClick={watchAdForGems}>
                  {adBusy ? "LOADING AD…" : `📺 WATCH AD · +${DIAMONDS_PER_AD} 💎`}
                </button>
              )}
              {!isOwned && short > 0 && (
                <p className="armory-hint">
                  NEED {short.toLocaleString()} MORE TICKET{short === 1 ? "" : "S"} OR {gemPrice} 💎
                </p>
              )}
            </div>
          </section>

          <section className="armory-rack">
            {items.map((item) => {
              const own = ownedIds.includes(item.id);
              const on = equippedId === item.id;
              const rar = rarityOf(item.cost);
              return (
                <button
                  key={item.id}
                  style={{ ["--rar" as string]: RARITY_HEX[rar] }}
                  className={`armory-card ${own ? "" : "is-locked"} ${on ? "is-on" : ""} ${selected.id === item.id ? "is-sel" : ""}`}
                  onClick={() => (isGun ? setSelGun(item.id) : setSelCross(item.id))}
                >
                  <span className="armory-card-rar" />
                  <span className="armory-card-art">
                    <ModelViewer
                      kind={isGun ? "gun" : "crosshair"}
                      itemId={item.id}
                      className="model-viewer thumb"
                    />
                    {!own && <span className="armory-card-lock">🔒</span>}
                  </span>
                  <span className="armory-card-name">{item.name}</span>
                  <span className="armory-card-meta">
                    {on
                      ? "EQUIPPED"
                      : own
                        ? "OWNED"
                        : `${item.cost.toLocaleString()} 🎟 · ${diamondCost(item.cost)} 💎`}
                  </span>
                </button>
              );
            })}
          </section>
        </div>

        <div className="armory-foot">
          <Link to="/collection" className="armory-back">
            🎒 3D COLLECTION
          </Link>
          <Link to="/achievements" className="armory-back">
            🏅 ACHIEVEMENTS
          </Link>
        </div>
      </div>
    </main>
  );
}
