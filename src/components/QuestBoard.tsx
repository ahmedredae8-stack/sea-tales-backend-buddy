import { useEffect, useState } from "react";
import { Check, Gift } from "lucide-react";

import { QUESTS, claim, isDone, loadQuests, type QuestState } from "@/lib/quests";
import { playSfx } from "@/lib/sound";

/** Daily quest board — shared by the fish market and the shipyard. */
export function QuestBoard() {
  const [state, setState] = useState<QuestState | null>(null);

  useEffect(() => {
    setState(loadQuests());
    const onStorage = () => setState(loadQuests());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!state) return null;

  return (
    <section className="quest-board">
      <header className="quest-head">
        <img src="/__l5e/assets-v1/1b52eadc-9045-47f2-9648-efe6cc13c79c/quest.png" alt="" className="h-7 w-7 object-contain" />
        <h2>المهام اليومية</h2>
        <span className="quest-gems">
          <img src="/__l5e/assets-v1/81b9318d-8399-478f-bd28-abec7665a1a6/gem.png" alt="" className="h-4 w-4" />
          {state.gems}
        </span>
      </header>

      <ul className="grid gap-2">
        {QUESTS.map((q) => {
          const done = isDone(state, q);
          const taken = state.claimed.includes(q.id);
          const pct = Math.min(100, Math.round(((state.progress[q.id] ?? 0) / q.goal) * 100));
          return (
            <li key={q.id} className={`quest-row ${done ? "quest-row-done" : ""}`}>
              <img src={q.icon} alt="" className="h-10 w-10 shrink-0 object-contain drop-shadow" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{q.title}</p>
                <p className="truncate text-[11px] text-white/50">{q.hint}</p>
                <div className="quest-bar">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
              <button
                type="button"
                disabled={!done || taken}
                onPointerEnter={() => playSfx("hover", 0.2)}
                onClick={() => {
                  playSfx("click", 0.8);
                  setState((s) => (s ? claim(s, q.id) : s));
                }}
                className="quest-claim"
              >
                {taken ? <Check className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                <span className="tabular-nums">{q.gems}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
