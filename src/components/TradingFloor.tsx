import { useEffect, useMemo, useState } from "react";

import {
  ASSETS,
  FISH_ASSETS,
  SHIP_ASSETS,
  book,
  candles,
  change,
  fmtCoins,
  loadLedger,
  saveLedger,
  spot,
  type Asset,
  type AssetKind,
  type Ledger,
  type Side,
} from "@/lib/market";
import { playSfx } from "@/lib/sound";

/**
 * The trading floor: a live-feeling exchange for fish and ships.
 * Purely image driven — every row leads with the asset artwork, no icon fonts.
 */
export function TradingFloor({ start = "fish" }: { start?: AssetKind }) {
  const [kind, setKind] = useState<AssetKind>(start);
  const list = kind === "fish" ? FISH_ASSETS : SHIP_ASSETS;
  const [assetId, setAssetId] = useState(list[0]!.id);
  const [qty, setQty] = useState(1);
  const [tick, setTick] = useState(0);
  const [ledger, setLedger] = useState<Ledger>(() => loadLedger());
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => setLedger(loadLedger()), []);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 6000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (!list.some((a) => a.id === assetId)) setAssetId(list[0]!.id);
  }, [kind, list, assetId]);

  const asset: Asset = useMemo(
    () => ASSETS.find((a) => a.id === assetId) ?? list[0]!,
    [assetId, list],
  );

  const price = useMemo(() => spot(asset), [asset, tick]);
  const move = useMemo(() => change(asset), [asset, tick]);
  const bars = useMemo(() => candles(asset, 40), [asset, tick]);
  const depth = useMemo(() => book(asset), [asset, tick]);
  const owned = ledger.holdings[asset.id] ?? 0;
  const total = price * qty;

  const hi = Math.max(...bars.map((b) => b.h));
  const lo = Math.min(...bars.map((b) => b.l));
  const span = Math.max(1e-6, hi - lo);
  const y = (v: number) => 100 - ((v - lo) / span) * 100;

  const trade = (side: Side) => {
    playSfx("click", 0.7);
    setLedger((prev) => {
      const next: Ledger = {
        coins: prev.coins,
        holdings: { ...prev.holdings },
        orders: [...prev.orders],
      };
      const have = next.holdings[asset.id] ?? 0;
      if (side === "buy") {
        if (next.coins < total) {
          setFlash("لا تكفي العملات لإتمام الصفقة");
          return prev;
        }
        next.coins -= total;
        next.holdings[asset.id] = have + qty;
        setFlash(`تم شراء ${qty} × ${asset.name}`);
      } else {
        if (have < qty) {
          setFlash("لا تملك كمية كافية للبيع");
          return prev;
        }
        next.coins += total;
        next.holdings[asset.id] = have - qty;
        setFlash(`تم بيع ${qty} × ${asset.name}`);
      }
      next.orders = [
        { id: `${Date.now()}`, assetId: asset.id, side, qty, price, at: Date.now() },
        ...next.orders,
      ].slice(0, 12);
      saveLedger(next);
      return next;
    });
  };

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 2200);
    return () => window.clearTimeout(t);
  }, [flash]);

  return (
    <div dir="rtl" className="tf">
      <header className="tf-top">
        <div className="tf-tabs">
          <button
            type="button"
            className={`tf-tab ${kind === "fish" ? "is-on" : ""}`}
            onClick={() => {
              playSfx("click", 0.5);
              setKind("fish");
            }}
          >
            <img src="/__l5e/assets-v1/8375eb41-2ea8-4351-8b7a-448d60539f87/pin-fish.png" alt="" />
            سوق السمك
          </button>
          <button
            type="button"
            className={`tf-tab ${kind === "ship" ? "is-on" : ""}`}
            onClick={() => {
              playSfx("click", 0.5);
              setKind("ship");
            }}
          >
            <img src="/__l5e/assets-v1/fb9b0fc1-ea0d-4c43-a889-ee8820a084f2/pin-ship.png" alt="" />
            سوق السفن
          </button>
        </div>
        <div className="tf-wallet">
          <img src="/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png" alt="" />
          <b>{fmtCoins(ledger.coins)}</b>
        </div>
      </header>

      <div className="tf-grid">
        <aside className="tf-list">
          {list.map((a) => {
            const p = spot(a);
            const ch = change(a);
            return (
              <button
                key={a.id}
                type="button"
                className={`tf-row ${a.id === asset.id ? "is-on" : ""}`}
                onClick={() => {
                  playSfx("click", 0.45);
                  setAssetId(a.id);
                }}
              >
                <img src={a.img} alt="" className="tf-row-img" />
                <span className="tf-row-name">
                  <b>{a.name}</b>
                  <i>{a.tag}</i>
                </span>
                <span className="tf-row-price">
                  <b>{fmtCoins(p)}</b>
                  <i className={ch >= 0 ? "up" : "dn"}>
                    {ch >= 0 ? "▲" : "▼"} {Math.abs(ch).toFixed(2)}%
                  </i>
                </span>
              </button>
            );
          })}
        </aside>

        <section className="tf-main">
          <div className="tf-head">
            <img src={asset.img} alt="" className="tf-hero" />
            <div className="tf-head-text">
              <h3>{asset.name}</h3>
              <p>
                المعروض {fmtCoins(asset.supply)} · بحوزتك {owned}
              </p>
            </div>
            <div className="tf-price">
              <b>{fmtCoins(price)}</b>
              <i className={move >= 0 ? "up" : "dn"}>
                {move >= 0 ? "▲" : "▼"} {Math.abs(move).toFixed(2)}%
              </i>
            </div>
          </div>

          <svg className="tf-chart" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden>
            {bars.map((b, i) => {
              const x = (i + 0.5) * (200 / bars.length);
              const w = Math.max(1.6, 200 / bars.length - 1.6);
              const up = b.c >= b.o;
              const top = y(Math.max(b.o, b.c));
              const h = Math.max(0.8, Math.abs(y(b.o) - y(b.c)));
              return (
                <g key={i} className={up ? "cd-up" : "cd-dn"}>
                  <line x1={x} x2={x} y1={y(b.h)} y2={y(b.l)} />
                  <rect x={x - w / 2} y={top} width={w} height={h} />
                </g>
              );
            })}
          </svg>

          <div className="tf-book">
            <div className="tf-book-col">
              <h4>طلبات الشراء</h4>
              {depth.bids.map((r, i) => (
                <p key={i}>
                  <span className="up">{fmtCoins(r.price)}</span>
                  <span>{r.qty}</span>
                </p>
              ))}
            </div>
            <div className="tf-book-col">
              <h4>عروض البيع</h4>
              {depth.asks.map((r, i) => (
                <p key={i}>
                  <span className="dn">{fmtCoins(r.price)}</span>
                  <span>{r.qty}</span>
                </p>
              ))}
            </div>
          </div>

          <footer className="tf-ticket">
            <div className="tf-qty">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <b>{qty}</b>
              <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))}>
                +
              </button>
            </div>
            <span className="tf-total">
              الإجمالي <b>{fmtCoins(total)}</b>
            </span>
            <button type="button" className="tf-buy" onClick={() => trade("buy")}>
              شراء
            </button>
            <button type="button" className="tf-sell" onClick={() => trade("sell")}>
              بيع
            </button>
          </footer>

          {flash && <p className="tf-flash">{flash}</p>}

          {ledger.orders.length > 0 && (
            <div className="tf-log">
              {ledger.orders.slice(0, 5).map((o) => (
                <p key={o.id}>
                  <span className={o.side === "buy" ? "up" : "dn"}>
                    {o.side === "buy" ? "شراء" : "بيع"}
                  </span>
                  {ASSETS.find((a) => a.id === o.assetId)?.name} × {o.qty} —{" "}
                  {fmtCoins(o.price * o.qty)}
                </p>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
