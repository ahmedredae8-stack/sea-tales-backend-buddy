import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";

import { NetCast } from "@/components/NetCast";
import { QuestBoard } from "@/components/QuestBoard";
import { CREWS } from "@/lib/items";
import { bump, loadQuests } from "@/lib/quests";
import { fmt, rarityLabel, ships, type Rarity, type Ship } from "@/lib/ships";
import { playSfx } from "@/lib/sound";

export const Route = createFileRoute("/shipyard")({
  head: () => ({
    meta: [
      { title: "مصنع السفن — Island Bay" },
      { name: "description", content: "اشترِ وطوّر سفنك: أرسلها للميناء أو للإبحار أو اختر طاقمها." },
      { property: "og:title", content: "مصنع السفن — Island Bay" },
      { property: "og:description", content: "كتالوج السفن والترقيات وإدارة الطواقم داخل خليج الجزيرة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shipyard,
});

const filters: { id: "all" | Rarity; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "common", label: rarityLabel.common },
  { id: "rare", label: rarityLabel.rare },
  { id: "epic", label: rarityLabel.epic },
  { id: "legendary", label: rarityLabel.legendary },
];


export function Shipyard() {
  const [filter, setFilter] = useState<"all" | Rarity>("all");
  const [open, setOpen] = useState<Ship | null>(null);
  const [panel, setPanel] = useState<"dock" | "sell" | "crew">("dock");
  const [casting, setCasting] = useState(false);

  const list = ships.filter((s) => filter === "all" || s.rarity === filter);

  const openShip = (s: Ship) => {
    playSfx("click", 0.7);
    setPanel("dock");
    setOpen(s);
  };

  return (
    <main dir="rtl" className="min-h-[100svh] bg-[oklch(0.16_0.04_250)] text-white">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[color-mix(in_oklab,var(--gold)_35%,transparent)] bg-black/70 px-4 py-3 backdrop-blur-xl">
        <Link to="/" aria-label="رجوع" className="rounded-xl bg-black/40 p-2 transition hover:bg-black/60">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-black text-[var(--gold)] drop-shadow">مصنع السفن</h1>
      </header>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              playSfx("click", 0.6);
              setFilter(f.id);
            }}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition ${
              filter === f.id
                ? "border-[var(--gold)] bg-[var(--gold)] text-black"
                : "border-white/20 text-white/70 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-3 px-4 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onPointerEnter={() => playSfx("hover", 0.22)}
              onClick={() => openShip(s)}
              className="ship-card w-full text-right"
            >
              <img src={s.img} alt={s.name} loading="lazy" className="h-24 w-28 shrink-0 object-contain drop-shadow-xl" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-black">{s.name}</span>
                  <span className="shrink-0 rounded-full border border-[var(--gold)]/60 px-2 py-0.5 text-[10px] font-bold text-[var(--gold)]">
                    {rarityLabel[s.rarity]}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-white/55">{s.desc}</span>
                <span className="mt-2 flex items-center gap-1.5 text-sm font-black text-[var(--gold)]">
                  <img src={s.currency === "coin" ? "/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png" : "/__l5e/assets-v1/81b9318d-8399-478f-bd28-abec7665a1a6/gem.png"} alt="" className="h-4 w-4" />
                  {fmt(s.price)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div className="fixed inset-0 z-30 grid place-items-end bg-black/70 p-3 backdrop-blur-sm sm:place-items-center">
          <div className="ship-sheet">
            <button
              type="button"
              aria-label="إغلاق"
              onClick={() => {
                playSfx("click", 0.5);
                setOpen(null);
              }}
              className="absolute left-3 top-3 rounded-full bg-black/50 p-1.5 text-white/80 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <img src={open.img} alt={open.name} className="mx-auto h-28 object-contain drop-shadow-2xl" />
            <h2 className="mt-1 text-center text-lg font-black text-[var(--gold)]">{open.name}</h2>

            <div className="mt-3 flex justify-center gap-3">
              {[
                { id: "dock" as const, img: "/__l5e/assets-v1/aeaa94a5-0adf-4b22-ae52-9e1740a462a3/act-dock.png", label: "ذهاب ورجوع" },
                { id: "sell" as const, img: "/__l5e/assets-v1/c5b717ba-5f44-4e1c-b012-74296b9d2175/act-sail.png", label: "بيع السفينة" },
                { id: "crew" as const, img: "/__l5e/assets-v1/f29ed123-2209-4423-a9f2-f05adfb07583/act-crew.png", label: "الطاقم" },
              ].map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onPointerEnter={() => playSfx("hover", 0.22)}
                  onClick={() => {
                    playSfx("click", 0.7);
                    setPanel(a.id);
                  }}
                  className={`act-btn ${panel === a.id ? "act-btn-on" : ""}`}
                >
                  <img src={a.img} alt="" className="h-14 w-14 object-contain" />
                  <span className="text-[11px] font-bold">{a.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-white/12 bg-black/40 p-3">
              {panel === "dock" && (
                <dl className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  {[
                    { k: "السرعة", v: open.speed },
                    { k: "الحمولة", v: open.cargo },
                    { k: "الطاقم", v: open.crew },
                  ].map((st) => (
                    <div key={st.k} className="rounded-xl bg-black/40 py-2">
                      <dt className="text-white/50">{st.k}</dt>
                      <dd className="font-black text-[var(--gold)]">{st.v}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {panel === "dock" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      bump(loadQuests(), "catch");
                      setCasting(true);
                    }}
                    className="rounded-2xl bg-gradient-to-b from-sky-500 to-sky-700 py-2 text-sm font-black shadow-lg transition hover:brightness-110"
                  >
                    ابحر وارمِ الشباك
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("click", 0.8);
                      bump(loadQuests(), "upgrade");
                    }}
                    className="rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 py-2 text-sm font-black shadow-lg transition hover:brightness-110"
                  >
                    ترقية السفينة
                  </button>
                </div>
              )}

              {panel === "sell" && (
                <div className="grid gap-2 text-center">
                  <p className="text-sm text-white/70">بِع «{open.name}» واسترجع 60% من قيمتها.</p>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("click", 0.8);
                      setOpen(null);
                    }}
                    className="mx-auto flex items-center gap-2 rounded-2xl bg-gradient-to-b from-rose-500 to-rose-700 px-6 py-2 text-sm font-black shadow-lg transition hover:brightness-110"
                  >
                    <img src="/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png" alt="" className="h-4 w-4" />
                    بيع · {fmt(Math.round(open.price * 0.6))}
                  </button>
                </div>
              )}

              {panel === "crew" && (
                <ul className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                  {CREWS.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 rounded-xl bg-black/40 px-3 py-2">
                      <img src={c.icon} alt="" className="h-8 w-8 object-contain" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{c.name}</span>
                        <span className="block truncate text-[11px] text-white/50">{c.desc}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playSfx("click", 0.75);
                          bump(loadQuests(), "crew");
                        }}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-[var(--gold)] px-2.5 py-1 text-xs font-black text-black"
                      >
                        <img src={c.currency === "coin" ? "/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png" : "/__l5e/assets-v1/81b9318d-8399-478f-bd28-abec7665a1a6/gem.png"} alt="" className="h-3.5 w-3.5" />
                        {fmt(c.price)} · {c.hours}H
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => playSfx("click", 0.8)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[var(--gold)] to-[var(--gold-deep)] py-2.5 text-sm font-black text-black transition hover:brightness-110"
            >
              <img src={open.currency === "coin" ? "/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png" : "/__l5e/assets-v1/81b9318d-8399-478f-bd28-abec7665a1a6/gem.png"} alt="" className="h-4 w-4" />
              شراء · {fmt(open.price)}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 pb-10">
        <QuestBoard />
      </div>

      {casting && <NetCast onDone={() => setCasting(false)} />}
    </main>
  );
}
