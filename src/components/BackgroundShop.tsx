import { Check, Crown, Moon, Sun, X } from "lucide-react";

import { currentPhase, phaseLabel, themes } from "@/lib/themes";
import { playSfx } from "@/lib/sound";

type Props = {
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function BackgroundShop({ activeId, onSelect, onClose }: Props) {
  const phase = currentPhase();

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="متجر الخلفيات"
      onClick={onClose}
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="shop-panel max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] p-5 sm:rounded-[2rem]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black tracking-wide text-[var(--gold)] drop-shadow">
              <Crown className="h-5 w-5" /> خزانة العوالم
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/55">
              {phase === "day" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              العالم الآن في {phaseLabel(phase)} — يتبدّل كل ٦ ساعات
            </p>
          </div>
          <button
            type="button"
            aria-label="إغلاق"
            onClick={onClose}
            className="rounded-full border border-[color-mix(in_oklab,var(--gold)_50%,transparent)] p-2 text-white/80 transition hover:scale-110 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 h-px w-full bg-gradient-to-l from-transparent via-[var(--gold)] to-transparent opacity-60" />

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {themes.map((t, i) => {
            const active = t.id === activeId;
            return (
              <li key={t.id} className="shop-card-in" style={{ animationDelay: `${i * 45}ms` }}>
                <button
                  type="button"
                  onPointerEnter={() => playSfx("hover", 0.25)}
                  onClick={() => {
                    playSfx("click", 0.7);
                    onSelect(t.id);
                  }}
                  className={`shop-card group relative block w-full overflow-hidden rounded-2xl text-right ${
                    active ? "shop-card-active" : ""
                  }`}
                >
                  <span className="grid grid-cols-2">
                    <img src={t.day.poster} alt="" loading="lazy" className="h-32 w-full object-cover" />
                    <img src={t.night.poster} alt={t.name} loading="lazy" className="h-32 w-full object-cover" />
                  </span>
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 pb-2.5">
                    <span className="text-sm font-bold text-white drop-shadow">{t.name}</span>
                    {active ? (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--gold)] px-2 py-0.5 text-[10px] font-black text-black">
                        <Check className="h-3 w-3" /> مُفعّل
                      </span>
                    ) : (
                      <span className="rounded-full border border-[var(--gold)]/60 px-2 py-0.5 text-[10px] font-bold text-[var(--gold)]">
                        مجاناً
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
