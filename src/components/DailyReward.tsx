import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { playSfx } from "@/lib/sound";

const KEY = "ib.daily.v1";
const DAYS = [
  { d: 1, icon: "/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png", label: "5,000" },
  { d: 2, icon: "/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png", label: "10,000" },
  { d: 3, icon: "/__l5e/assets-v1/81b9318d-8399-478f-bd28-abec7665a1a6/gem.png", label: "15" },
  { d: 4, icon: "/__l5e/assets-v1/906f37c0-d530-4e50-a3ce-00deaaf40a02/coin.png", label: "25,000" },
  { d: 5, icon: "/__l5e/assets-v1/81b9318d-8399-478f-bd28-abec7665a1a6/gem.png", label: "40" },
  { d: 6, icon: "/__l5e/assets-v1/08453a7e-1779-4eb1-9220-dfabe5462e44/chest.png", label: "صندوق" },
  { d: 7, icon: "/__l5e/assets-v1/31f47bd7-8999-4049-8835-3de413357bf2/cat-ship.png", label: "سفينة" },
];

type Saved = { day: string; streak: number };

const today = () => new Date().toISOString().slice(0, 10);

/** Daily login reward sheet — opens once per day. */
export function DailyReward() {
  const [open, setOpen] = useState(false);
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    let saved: Saved | null = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Saved | null;
    } catch {
      saved = null;
    }
    if (saved?.day === today()) {
      setStreak(saved.streak);
      return;
    }
    const next = { day: today(), streak: Math.min(7, (saved?.streak ?? 0) + 1) };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
    setStreak(next.streak);
    setOpen(true);
  }, []);

  if (!open) return null;

  return (
    <div className="daily-overlay" role="dialog" aria-label="مكافأة الدخول اليومي">
      <div className="daily-panel">
        <button
          type="button"
          aria-label="إغلاق"
          onClick={() => {
            playSfx("click", 0.6);
            setOpen(false);
          }}
          className="absolute left-3 top-3 rounded-full bg-black/50 p-1.5 text-white/80 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="daily-title">مكافأة الدخول اليومي</h2>
        <p className="mb-3 text-center text-xs text-white/60">يومك {streak} من 7 — لا تفوّت يومًا!</p>
        <ul className="grid grid-cols-4 gap-2">
          {DAYS.map((r) => (
            <li key={r.d} className={`daily-cell ${r.d < streak ? "daily-cell-past" : ""} ${r.d === streak ? "daily-cell-now" : ""}`}>
              <span className="text-[10px] font-bold text-white/60">يوم {r.d}</span>
              <img src={r.icon} alt="" className="h-8 w-8 object-contain" />
              <span className="text-[11px] font-black text-[var(--gold)]">{r.label}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            playSfx("click", 0.9);
            setOpen(false);
          }}
          className="daily-claim"
        >
          استلام
        </button>
      </div>
    </div>
  );
}
