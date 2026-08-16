import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ModelViewer } from "@/components/ModelViewer";
import { GUN_ITEMS } from "@/game/guns";
import { RARITY_LABEL, rarityOf } from "@/game/rarity";
import {
  SHOP_ITEMS,
  getEquipped,
  getEquippedGun,
  getOwned,
  getOwnedGuns,
  setEquipped,
  setEquippedGun,
} from "@/game/shop";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "Collection — 3D Armory | Toy Blitz Carnival" },
      {
        name: "description",
        content:
          "Spin every blaster and crosshair you own in full 3D, track collection completion and equip your carnival loadout in one tap.",
      },
      { property: "og:title", content: "Collection — 3D Armory | Toy Blitz Carnival" },
      {
        property: "og:description",
        content: "Rotate your carnival blasters and reticles in 3D and equip them instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollectionPage,
});

const RARITY_HEX: Record<string, string> = {
  common: "#9fb2d8",
  rare: "#4dd2ff",
  epic: "#c07bff",
  legendary: "#ffb028",
};

function CollectionPage() {
  const [owned, setOwned] = useState<string[]>(["classic"]);
  const [ownedGuns, setOwnedGuns] = useState<string[]>(["carnival"]);
  const [crosshair, setCrosshair] = useState("classic");
  const [gun, setGun] = useState("carnival");
  const [tab, setTab] = useState<"guns" | "sights">("guns");
  const [selGun, setSelGun] = useState("carnival");
  const [selCross, setSelCross] = useState("classic");
  const [note, setNote] = useState("");

  useEffect(() => {
    setOwned(getOwned());
    setOwnedGuns(getOwnedGuns());
    setCrosshair(getEquipped());
    setGun(getEquippedGun());
    setSelGun(getEquippedGun());
    setSelCross(getEquipped());
  }, []);

  const flash = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote(""), 2200);
  };

  const isGun = tab === "guns";
  const items = isGun ? GUN_ITEMS : SHOP_ITEMS;
  const selected = items.find((i) => i.id === (isGun ? selGun : selCross)) ?? items[0]!;
  const ownedIds = isGun ? ownedGuns : owned;
  const equippedId = isGun ? gun : crosshair;
  const hasSelected = ownedIds.includes(selected.id);
  const selectedEquipped = equippedId === selected.id;
  const rarity = rarityOf(selected.cost);

  const equip = (id: string) => {
    if (!ownedIds.includes(id)) return;
    if (isGun) {
      setEquippedGun(id);
      setGun(id);
    } else {
      setEquipped(id);
      setCrosshair(id);
    }
    flash(`${items.find((i) => i.id === id)?.name ?? "Item"} equipped!`);
  };

  const gunPct = Math.round((ownedGuns.length / GUN_ITEMS.length) * 100);
  const sightPct = Math.round((owned.length / SHOP_ITEMS.length) * 100);
  const total = ownedGuns.length + owned.length;
  const totalMax = GUN_ITEMS.length + SHOP_ITEMS.length;

  return (
    <main className="armory">
      <div className="armory-inner">
        <header className="armory-head">
          <div>
            <p className="armory-eyebrow">PLAYER ARMORY</p>
            <h1 className="armory-title">3D COLLECTION</h1>
          </div>
          <div className="armory-chips">
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
            <div className="armory-chip">
              <strong>{Math.round((total / totalMax) * 100)}%</strong>
              <span>COMPLETE</span>
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
            onClick={() => setTab("guns")}
          >
            BLASTERS {gunPct}%
          </button>
          <button
            role="tab"
            aria-selected={!isGun}
            className={`armory-tab ${!isGun ? "is-on" : ""}`}
            onClick={() => setTab("sights")}
          >
            CROSSHAIRS {sightPct}%
          </button>
        </div>

        {note && <p className="armory-note">{note}</p>}

        <div className="armory-body">
          <section className="armory-stage" style={{ ["--rar" as string]: RARITY_HEX[rarity] }}>
            <div className="armory-stage-holo">
              <span className="armory-rarity">{RARITY_LABEL[rarity]}</span>
              <ModelViewer
                key={`${tab}-${selected.id}`}
                kind={isGun ? "gun" : "crosshair"}
                itemId={selected.id}
                className={`model-viewer ${hasSelected ? "" : "is-locked"}`}
              />
              <span className="armory-beam" />
              <span className="armory-disc" />
              <span className="armory-disc inner" />
            </div>
            <div className="armory-stage-info">
              <h2 className="armory-name">{selected.name}</h2>
              <p className="armory-blurb">{selected.blurb}</p>
              <p className="armory-hint">DRAG TO ROTATE · SCROLL TO ZOOM</p>
              {hasSelected ? (
                <button className="armory-cta" disabled={selectedEquipped} onClick={() => equip(selected.id)}>
                  {selectedEquipped ? "EQUIPPED" : "EQUIP"}
                </button>
              ) : (
                <Link to="/shop" className="armory-cta locked">
                  🔒 UNLOCK · {selected.cost.toLocaleString()} 🎟
                </Link>
              )}
            </div>
          </section>

          <section className="armory-rack">
            {items.map((item) => {
              const have = ownedIds.includes(item.id);
              const on = equippedId === item.id;
              const sel = selected.id === item.id;
              const rar = rarityOf(item.cost);
              return (
                <button
                  key={item.id}
                  style={{ ["--rar" as string]: RARITY_HEX[rar] }}
                  className={`armory-card ${have ? "" : "is-locked"} ${on ? "is-on" : ""} ${sel ? "is-sel" : ""}`}
                  onClick={() => (isGun ? setSelGun(item.id) : setSelCross(item.id))}
                  onDoubleClick={() => equip(item.id)}
                >
                  <span className="armory-card-rar" />
                  <span className="armory-card-art">
                    <ModelViewer
                      kind={isGun ? "gun" : "crosshair"}
                      itemId={item.id}
                      className="model-viewer thumb"
                    />
                    {!have && <span className="armory-card-lock">🔒</span>}
                  </span>
                  <span className="armory-card-name">{item.name}</span>
                  <span className="armory-card-meta">
                    {on ? "EQUIPPED" : have ? "OWNED" : `${item.cost.toLocaleString()} 🎟`}
                  </span>
                </button>
              );
            })}
          </section>
        </div>

        <div className="armory-foot">
          <Link to="/shop" className="armory-back">
            🛒 PRIZE SHOP
          </Link>
          <Link to="/achievements" className="armory-back">
            🏅 ACHIEVEMENTS
          </Link>
        </div>
      </div>
    </main>
  );
}
