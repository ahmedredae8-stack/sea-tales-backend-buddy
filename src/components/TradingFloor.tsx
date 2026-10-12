import { useEffect, useMemo, useState } from "react";

import { fleetCatalog, tripLabel } from "@/lib/fleetCatalog";
import { FISH, HARBOR_UPDATED, HOURS, buyShip, ownedShips, priceSeries, sellFish } from "@/lib/harbor";
import { fmtCoins, loadLedger, type AssetKind, type Ledger } from "@/lib/market";
import { useArtwork } from "@/lib/artwork";
import marketBg from "@/assets/ui/saudi-fish-market.jpg";
import { resolveShipArtwork } from "@/lib/shipArtwork";
import { playSfx } from "@/lib/sound";
import { Button } from "@/components/ui/button";

const COIN = "https://project--356242e8-144f-42b3-8292-474399c324ac.lovable.app/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png";
const GEM = "https://project--356242e8-144f-42b3-8292-474399c324ac.lovable.app/__l5e/assets-v1/81b9318d-8399-478f-bd28-abec7665a1a6/gem.png";

function useHarbor() {
  const [ledger, setLedger] = useState<Ledger>({ coins: 0, holdings: {}, orders: [] });
  const [owned, setOwned] = useState<number[]>([1]);
  useEffect(() => {
    const sync = () => { setLedger(loadLedger()); setOwned(ownedShips()); };
    sync();
    window.addEventListener(HARBOR_UPDATED, sync);
    return () => window.removeEventListener(HARBOR_UPDATED, sync);
  }, []);
  return { ledger, owned };
}

export function TradingFloor({ start = "fish", locked = false }: { start?: AssetKind; locked?: boolean }) {
  const [kind, setKind] = useState<AssetKind>(start);
  const { ledger, owned } = useHarbor();
  return (
    <div dir="rtl" className={`mk mk-${kind}`}>
      {kind === "fish" && <img className="mk-market-art" src={marketBg} alt="سوق الصيد في ميناء سعودي" width={1024} height={1536} loading="lazy" />}
      <header className="mk-top">
        {!locked ? <div className="mk-tabs">
          <Button variant="ghost" className={kind === "fish" ? "is-on" : ""} onClick={() => { playSfx("click", 0.5); setKind("fish"); }}>سوق السمك</Button>
          <Button variant="ghost" className={kind === "ship" ? "is-on" : ""} onClick={() => { playSfx("click", 0.5); setKind("ship"); }}>سوق السفن</Button>
        </div> : <strong>{kind === "ship" ? "أسطولك وميناء السفن" : "حصيلة الصيد"}</strong>}
        <span className="mk-wallet"><img src={COIN} alt="" /><b>{fmtCoins(ledger.coins)}</b></span>
      </header>
      {kind === "fish" ? <FishDesk ledger={ledger} /> : <ShipDesk ledger={ledger} owned={owned} />}
    </div>
  );
}

function FishDesk({ ledger }: { ledger: Ledger }) {
  const inHold = FISH.filter((f) => (ledger.holdings[f.id] ?? 0) > 0);
  const [id, setId] = useState<string>("");
  const fish = inHold.find((f) => f.id === id) ?? inHold[0];
  const have = fish ? ledger.holdings[fish.id] ?? 0 : 0;
  const [qty, setQty] = useState(0);
  const [msg, setMsg] = useState("");
  useEffect(() => setQty(have), [fish?.id, have]);
  const series = useMemo(() => (fish ? priceSeries(fish) : []), [fish]);

  if (!fish) return <p className="mk-empty">مخزنك فارغ — أرسل سفنك للصيد ثم عد لبيع ما اصطدته.</p>;

  const price = series[series.length - 1] ?? fish.base;
  const hi = Math.max(...series) * 1.1, lo = Math.min(...series) * 0.9;
  const pt = (v: number, i: number) => `${10 + i * (180 / (series.length - 1))},${90 - ((v - lo) / (hi - lo)) * 80}`;
  const ticks = [0, 1, 2, 3, 4].map((i) => lo + ((hi - lo) * i) / 4);

  return (
    <div className="mk-fish">
      <div className="mk-catch-row">
        {inHold.map((f) => (
          <Button variant="ghost" key={f.id} className={f.id === fish.id ? "is-on" : ""} onClick={() => { playSfx("click", 0.45); setId(f.id); }}>
            <img src={f.img} alt="" /><span>{f.name}</span><small>x{fmtCoins(ledger.holdings[f.id] ?? 0)}</small>
          </Button>
        ))}
      </div>
      <div className="mk-quality">الجودة: 100%</div>
      <div className="mk-paper">
        <svg viewBox="0 0 200 110" aria-label={`سعر ${fish.name} خلال الساعات الماضية`}>
          {ticks.map((t) => <text key={t} x="0" y={92 - ((t - lo) / (hi - lo)) * 80} className="mk-axis">{t.toFixed(1)}$</text>)}
          <polyline points={series.map(pt).join(" ")} />
          <circle cx={pt(price, series.length - 1).split(",")[0]} cy={pt(price, series.length - 1).split(",")[1]} r="2.4" />
          {HOURS.map((h, i) => <text key={h} x={10 + i * (180 / (HOURS.length - 1))} y="106" className="mk-axis" textAnchor="middle">{h}</text>)}
        </svg>
      </div>
      <p className="mk-price">السعر الحالي: <b>{price}</b></p>
      <label className="mk-slider">
        <span>{fmtCoins(qty)}/{fmtCoins(have)}</span>
        <input aria-label="كمية السمك للبيع" type="range" min={1} max={have} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        <span className="mk-earn"><img src={COIN} alt="" />{fmtCoins(Math.round(qty * price))}</span>
      </label>
      <Button className="mk-sell" onClick={() => {
        const r = sellFish(fish, qty, price);
        playSfx("click", 0.8);
        setMsg(typeof r === "string" ? r : `تم بيع ${fmtCoins(qty)} ${fish.name}`);
      }}>بيع</Button>
      {msg && <p className="mk-flash" role="status">{msg}</p>}
    </div>
  );
}

function ShipDesk({ ledger, owned }: { ledger: Ledger; owned: number[] }) {
  const { map: art, ready } = useArtwork();
  const [msg, setMsg] = useState("");
  const mine = fleetCatalog.filter((s) => owned.includes(s.id));
  const forSale = fleetCatalog.filter((s) => !owned.includes(s.id));
  const card = (s: (typeof fleetCatalog)[number], isMine: boolean) => (
    <li key={s.id} className={`mk-ship ${isMine ? "is-mine" : ""}`}>
      {ready || art[`ship-${s.id}:idle`] ? <img src={resolveShipArtwork(art, s.id, "idle", s.hull)} alt="" loading="lazy" /> : <span className="product-art-wait" aria-hidden="true" />}
      <strong>{s.name}</strong>
      <dl className="mk-ship-specs">
        <div><dt>مدة الصيد</dt><dd>{tripLabel(s.tripSeconds)}</dd></div>
        <div><dt>نوع الصيد</dt><dd>{s.fish.join(" · ")}</dd></div>
        {s.source === "tribe" && <div><dt>المصدر</dt><dd>القبيلة</dd></div>}
      </dl>
      {isMine ? <span className="mk-owned">في أسطولك</span> : (
        <Button aria-label={`شراء ${s.name}`} disabled={s.currency !== "coin" || ledger.coins < s.price} title={s.currency !== "coin" ? "الشراء بالجواهر غير متاح حالياً" : undefined} onClick={() => { playSfx("click", 0.7); const e = buyShip(s); setMsg(e ?? `انضمت ${s.name} إلى أسطولك`); }}>
          <img src={s.currency === "coin" ? COIN : GEM} alt="" />{fmtCoins(s.price)}
        </Button>
      )}
    </li>
  );
  return (
    <div className="mk-ships">
      {msg && <p className="mk-flash" role="status">{msg}</p>}
      <h3>سفني ({mine.length})</h3>
      <ul>{mine.map((s) => card(s, true))}</ul>
      <h3>للشراء ({forSale.length})</h3>
      <ul>{forSale.map((s) => card(s, false))}</ul>
    </div>
  );
}
