import { useMemo, useState } from "react";
import { Check, Crown, Gem, Minus, Plus, Shield, ShipWheel, Swords, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GameSprite } from "@/components/GameSprite";
import { ARMORS, CREWS, GEM_PACKS, WEAPONS } from "@/lib/items";
import { fleetCatalog, tripLabel } from "@/lib/fleetCatalog";
import { fmt } from "@/lib/ships";

import { currentPhase, phaseLabel, themes } from "@/lib/themes";
import { playSfx } from "@/lib/sound";

type StoreTab = "gems" | "crew" | "weapons" | "armor" | "ships" | "worlds";
type Product = {
  id: string;
  title: string;
  desc: string;
  price: number;
  currency: "coin" | "gem";
  art: React.ReactNode;
};

const sectionTitle: Record<StoreTab, string> = {
  gems: "الجواهر",
  crew: "الطواقم",
  weapons: "الأسلحة",
  armor: "الدروع",
  ships: "السفن",
  worlds: "الخلفيات",
};

export function GameStore({ activeId, onSelect, onClose }: { activeId: string; onSelect: (id: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<StoreTab>("ships");
  const tabs = [
    { id: "gems" as const, label: "جواهر", icon: Gem },
    { id: "crew" as const, label: "طواقم", icon: Users },
    { id: "weapons" as const, label: "أسلحة", icon: Swords },
    { id: "armor" as const, label: "حماية", icon: Shield },
    { id: "ships" as const, label: "سفن", icon: ShipWheel },
    { id: "worlds" as const, label: "خلفيات", icon: Crown },
  ];

  const products = useMemo<Product[]>(() => {
    if (tab === "weapons") return WEAPONS.map((item, index) => ({ id: item.id, title: item.name, desc: `${item.desc} · قوة تدميرية ${item.power * 1000}`, price: item.price, currency: item.currency, art: <GameSprite atlas="weapon" index={index} /> }));
    if (tab === "crew") return CREWS.map((item, index) => ({ id: item.id, title: item.name, desc: `${item.desc} · ${item.hours}H`, price: item.price, currency: item.currency, art: <GameSprite atlas="crew" index={index} /> }));
    if (tab === "armor") return ARMORS.map((item, index) => ({ id: item.id, title: item.name, desc: `${item.desc} · دفاع ${item.defense * 500}`, price: item.price, currency: item.currency, art: <GameSprite atlas="armor" index={index} /> }));
    if (tab === "ships")
      return fleetCatalog.map((ship) => ({
        id: `ship-${ship.id}`,
        title: ship.name,
        desc: `${ship.fish.join(" · ")} · رحلة ${tripLabel(ship.tripSeconds)}${ship.source === "tribe" ? " · من القبيلة" : ""}`,
        price: ship.price,
        currency: ship.currency,
        art: <img src={ship.hull} alt="" loading="lazy" />,
      }));

    return [];
  }, [tab]);

  return (
    <div className="game-modal" role="dialog" aria-modal="true" aria-label="المتجر البحري" onClick={onClose}>
      <section dir="rtl" className="store-shell" onClick={(event) => event.stopPropagation()}>
        <header className="store-head">
          <div className="min-w-0">
            <p className="store-kicker">ميناء التجارة الملكي</p>
            <h2>المتجر</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="إغلاق المتجر" onClick={onClose} className="store-close"><X /></Button>
        </header>
        <nav className="store-tabs" aria-label="أقسام المتجر">
          {tabs.map((item) => (
            <Button key={item.id} variant="ghost" onClick={() => { playSfx("click", 0.55); setTab(item.id); }} className={tab === item.id ? "store-tab store-tab-active" : "store-tab"}>
              <item.icon /> <span>{item.label}</span>
            </Button>
          ))}
        </nav>
        <p className="store-banner">{sectionTitle[tab]}</p>
        <div className="store-body">
          {tab === "worlds" && (
            <>
              <p className="store-section-note">العالم الآن في {phaseLabel(currentPhase())} ويتبدّل تلقائيًا كل ٦ ساعات</p>
              <ul className="store-grid store-worlds">
                {themes.map((theme) => (
                  <li key={theme.id}>
                    <Button variant="ghost" onClick={() => onSelect(theme.id)} className={theme.id === activeId ? "store-product world-card selected" : "store-product world-card"}>
                      <span className="world-preview"><img src={theme.day.poster} alt="" loading="lazy" /><img src={theme.night.poster} alt="" loading="lazy" /></span>
                      <span className="product-copy"><strong>{theme.name}</strong><small>{theme.id === activeId ? "العالم الحالي" : "مجاني"}</small></span>
                      {theme.id === activeId && <Check className="product-check" />}
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {tab === "gems" && <GemPacks />}
          {products.length > 0 && <ProductPicker key={tab} items={products} />}
        </div>
      </section>
    </div>
  );
}

function GemPacks() {
  return (
    <ul className="store-grid gem-grid">
      {GEM_PACKS.map((pack, index) => (
        <li key={pack.id} className="store-product gem-card">
          <span className="product-art"><GameSprite atlas="gem" index={index} /></span>
          <span className="product-copy">
            <strong>{fmt(pack.gems)} جوهرة</strong>
            <small>{pack.bonus > 0 ? `+${fmt(pack.bonus)} مكافأة · ` : ""}VIP +{pack.vip}</small>
          </span>
          <Button disabled className="product-buy" title="الدفع غير متاح حالياً">{pack.price}</Button>
        </li>
      ))}
    </ul>
  );
}

function ProductPicker({ items }: { items: Product[] }) {
  const [pickedId, setPickedId] = useState(items[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const picked = items.find((item) => item.id === pickedId) ?? items[0];
  if (!picked) return null;
  const total = picked.price * qty;
  return (
    <>
      <ul className="store-grid">
        {items.map((item) => (
          <li key={item.id}>
            <Button variant="ghost" onClick={() => { setPickedId(item.id); setQty(1); playSfx("click", 0.5); }} className={item.id === picked.id ? "store-product item-card selected" : "store-product item-card"}>
              <span className="product-art">{item.art}</span>
              <span className="product-copy"><strong>{item.title}</strong><small>{item.desc}</small></span>
            </Button>
          </li>
        ))}
      </ul>
      <footer className="buy-bar">
        <span className="buy-art">{picked.art}<small>x{qty}</small></span>
        <span className="buy-copy"><strong>{picked.title}</strong><small>{picked.desc}</small></span>
        <span className="buy-controls">
          <Button variant="ghost" size="icon" aria-label="إنقاص" onClick={() => setQty((n) => Math.max(1, n - 1))}><Minus /></Button>
          <b>{qty}</b>
          <Button variant="ghost" size="icon" aria-label="زيادة" onClick={() => setQty((n) => Math.min(99, n + 1))}><Plus /></Button>
        </span>
        <Button className="product-buy buy-confirm" disabled title="الشراء غير متاح حالياً">
          <img src={picked.currency === "coin" ? "/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png" : "/__l5e/assets-v1/81b9318d-8399-478f-bd28-abec7665a1a6/gem.png"} alt="" />
          {total === 0 ? "مجاني" : fmt(total)} · غير متاح
        </Button>
      </footer>
    </>
  );
}
