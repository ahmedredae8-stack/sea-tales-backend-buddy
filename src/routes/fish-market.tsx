import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Info } from "lucide-react";

import { NetCast } from "@/components/NetCast";
import { QuestBoard } from "@/components/QuestBoard";
import { bump, loadQuests } from "@/lib/quests";
import { playSfx } from "@/lib/sound";

export const Route = createFileRoute("/fish-market")({
  head: () => ({
    meta: [
      { title: "سوق السمك — Island Bay" },
      { name: "description", content: "بِع صيدك اليومي في سوق السمك وتابع مخطط الأسعار والجودة واللآلئ." },
      { property: "og:title", content: "سوق السمك — Island Bay" },
      { property: "og:description", content: "أسعار الأسماك اللحظية ومخطط السوق وبيع الصيد داخل خليج الجزيرة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FishMarket,
});

type Catch = {
  id: string;
  name: string;
  img: string;
  tier: string;
  base: number;
  stock: number;
  quality: number;
};

const CATCH: Catch[] = [
  { id: "sardine", name: "سردين", img: "/__l5e/assets-v1/25365535-261c-4a49-a6e3-842b94b8a2d8/fish-sardine.png", tier: "شائع", base: 1.2, stock: 7517, quality: 100 },
  { id: "mackerel", name: "ماكريل", img: "/__l5e/assets-v1/ffebb842-1d7a-4cd2-9fae-d66883e496e6/fish-mackerel.png", tier: "شائع", base: 3.4, stock: 4210, quality: 92 },
  { id: "tuna", name: "تونة", img: "/__l5e/assets-v1/d40f7c1c-8c7f-47ec-89a0-120eaa992bde/fish-tuna.png", tier: "نادر", base: 9.2, stock: 1860, quality: 88 },
  { id: "swordfish", name: "سمك السيف", img: "/__l5e/assets-v1/c3244a96-c3a8-495b-ac9e-2ece36ee74e6/fish-swordfish.png", tier: "ملحمي", base: 17.5, stock: 640, quality: 76 },
  { id: "turtle", name: "سلحفاة", img: "/__l5e/assets-v1/67e96dc8-9734-4101-8659-09807e61e0af/fish-turtle.png", tier: "ملحمي", base: 21.4, stock: 310, quality: 95 },
  { id: "pearl", name: "محار اللؤلؤ", img: "/__l5e/assets-v1/4b0616ca-5528-47ea-8c87-3ea157b6de3e/fish-pearl.png", tier: "أسطوري", base: 48, stock: 96, quality: 100 },
];

const HOURS = ["4 pm", "5 pm", "6 pm", "7 pm", "8 pm", "9 pm", "10 pm", "11 pm", "12 pm", "1 am", "2 am", "3 am"];

/** Deterministic pseudo-random walk so the chart is stable per fish. */
function series(seed: number, base: number) {
  let v = base;
  return HOURS.map((_, i) => {
    const n = Math.sin((seed + 1) * 12.9898 + i * 78.233) * 43758.5453;
    v = Math.max(base * 0.55, Math.min(base * 1.75, v + (n - Math.floor(n) - 0.45) * base * 0.35));
    return Number(v.toFixed(2));
  });
}

export function FishMarket() {
  const [activeId, setActiveId] = useState(CATCH[0]!.id);
  const [qty, setQty] = useState(CATCH[0]!.stock);
  const [casting, setCasting] = useState(false);
  const [coins, setCoins] = useState(69156);

  const active = CATCH.find((c) => c.id === activeId)!;
  const data = useMemo(() => series(CATCH.findIndex((c) => c.id === activeId), active.base), [activeId, active.base]);
  const price = data[data.length - 1]!;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / (max - min || 1)) * 88 - 6;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const select = (c: Catch) => {
    playSfx("click", 0.6);
    setActiveId(c.id);
    setQty(c.stock);
  };

  const sell = () => {
    playSfx("click", 0.85);
    setCoins((c) => c + Math.round(qty * price));
    bump(loadQuests(), "sell");
    setQty(0);
  };

  return (
    <main dir="rtl" className="min-h-[100svh] bg-[oklch(0.16_0.04_250)] text-white">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[color-mix(in_oklab,var(--gold)_35%,transparent)] bg-black/70 px-4 py-3 backdrop-blur-xl">
        <Link to="/" aria-label="رجوع" className="rounded-xl bg-black/40 p-2 transition hover:bg-black/60">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-black text-[var(--gold)] drop-shadow">سوق السمك</h1>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-sm font-black text-[var(--gold)]">
          <img src="/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png" alt="" className="h-4 w-4" />
          {coins.toLocaleString("en-US")}
        </span>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-10">
        {/* Catch selector */}
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 py-4">
          {CATCH.map((c) => (
            <li key={c.id} className="shrink-0">
              <button
                type="button"
                onPointerEnter={() => playSfx("hover", 0.22)}
                onClick={() => select(c)}
                className={`grid w-[5.5rem] place-items-center gap-1 rounded-2xl border p-2 transition ${
                  c.id === activeId
                    ? "border-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_18%,transparent)]"
                    : "border-white/15 bg-black/35 hover:border-white/40"
                }`}
              >
                <img src={c.img} alt={c.name} loading="lazy" className="h-12 w-12 object-contain drop-shadow" />
                <span className="text-[11px] font-bold">{c.name}</span>
                <span className="text-[10px] text-white/50">{c.tier}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Quality ribbon */}
        <div className="flex items-center gap-2 rounded-full border border-emerald-300/40 bg-gradient-to-l from-emerald-500 to-emerald-600 px-3 py-1.5 shadow-lg">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-emerald-700">
            <Info className="h-3.5 w-3.5" />
          </span>
          <p className="flex-1 text-center text-sm font-black">الجودة: {active.quality}%</p>
        </div>

        {/* Price chart on parchment */}
        <section className="mt-4 rounded-3xl border border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-gradient-to-b from-[oklch(0.94_0.03_85)] to-[oklch(0.87_0.05_80)] p-3 text-[oklch(0.28_0.05_60)] shadow-2xl">
          <div className="flex gap-2">
            <div className="flex flex-col justify-between py-1 text-[10px] font-bold tabular-nums opacity-70">
              {[max, (max * 2 + min) / 3, (max + min * 2) / 3, min].map((v, i) => (
                <span key={i}>{v.toFixed(1)}$</span>
              ))}
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 flex-1">
              <path d={path} fill="none" stroke="oklch(0.6 0.22 25)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
              <circle cx="100" cy={100 - ((price - min) / (max - min || 1)) * 88 - 6} r="2" fill="oklch(0.7 0.2 145)" />
            </svg>
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-bold opacity-70">
            {HOURS.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
        </section>

        <p className="mt-3 text-center text-lg font-black">
          السعر الحالي: <span className="text-[var(--gold)]">{price.toFixed(1)}$</span>
        </p>

        {/* Quantity */}
        <div className="mt-3 grid gap-2">
          <p className="text-center text-sm font-black tabular-nums">
            {qty.toLocaleString("en-US")}/{active.stock.toLocaleString("en-US")}
          </p>
          <input
            type="range"
            min={0}
            max={active.stock}
            value={qty}
            aria-label="الكمية"
            onChange={(e) => setQty(Number(e.target.value))}
            className="fish-range"
          />
          <p className="flex items-center justify-center gap-1.5 text-sm font-black text-emerald-300">
            <img src="/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png" alt="" className="h-4 w-4" />
            {Math.round(qty * price).toLocaleString("en-US")}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={qty === 0}
            onPointerEnter={() => playSfx("hover", 0.25)}
            onClick={sell}
            className="rounded-2xl bg-gradient-to-b from-[var(--gold)] to-[var(--gold-deep)] py-3 text-lg font-black text-black shadow-lg transition hover:brightness-110 disabled:opacity-40"
          >
            بيع
          </button>
          <button
            type="button"
            onPointerEnter={() => playSfx("hover", 0.25)}
            onClick={() => {
              bump(loadQuests(), "catch");
              setCasting(true);
            }}
            className="rounded-2xl border border-sky-300/50 bg-gradient-to-b from-sky-500 to-sky-700 py-3 text-lg font-black shadow-lg transition hover:brightness-110"
          >
            ارمِ الشباك
          </button>
        </div>
        <QuestBoard />
      </div>

      {casting && <NetCast onDone={() => setCasting(false)} />}
    </main>
  );
}
