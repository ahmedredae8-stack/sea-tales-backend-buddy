/** Daily quests: local progress, midnight reset, gem rewards. */

export type QuestId = "catch" | "sell" | "crew" | "upgrade";

export type Quest = {
  id: QuestId;
  title: string;
  hint: string;
  goal: number;
  gems: number;
  icon: string;
};

export const QUESTS: Quest[] = [
  { id: "catch", title: "ارمِ الشباك 5 مرات", hint: "اصطد من سوق السمك أو من رحلة سفينة", goal: 5, gems: 15, icon: "/__l5e/assets-v1/21f152aa-6da2-4e28-9df2-90d8692a372d/net.png" },
  { id: "sell", title: "بِع 3 دفعات صيد", hint: "بِع صيدك بأفضل سعر في السوق", goal: 3, gems: 20, icon: "/__l5e/assets-v1/d40f7c1c-8c7f-47ec-89a0-120eaa992bde/fish-tuna.png" },
  { id: "crew", title: "جهّز طاقمًا مرتين", hint: "شغّل بحّارة أو مرشدًا على سفينتك", goal: 2, gems: 25, icon: "/__l5e/assets-v1/f29ed123-2209-4423-a9f2-f05adfb07583/act-crew.png" },
  { id: "upgrade", title: "طوّر سفينة واحدة", hint: "ارفع مستوى أي سفينة في مصنع السفن", goal: 1, gems: 40, icon: "/__l5e/assets-v1/aeaa94a5-0adf-4b22-ae52-9e1740a462a3/act-dock.png" },
];

export type QuestState = { day: string; progress: Record<QuestId, number>; claimed: QuestId[]; gems: number };

const KEY = "ib.quests.v1";

const today = () => new Date().toISOString().slice(0, 10);

const empty = (): QuestState => ({
  day: today(),
  progress: { catch: 0, sell: 0, crew: 0, upgrade: 0 },
  claimed: [],
  gems: 0,
});

export function loadQuests(): QuestState {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as QuestState;
    if (parsed.day !== today()) return { ...empty(), gems: parsed.gems ?? 0 };
    return { ...empty(), ...parsed, day: today() };
  } catch {
    return empty();
  }
}

export function saveQuests(s: QuestState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage blocked */
  }
}

export function bump(s: QuestState, id: QuestId, by = 1): QuestState {
  const quest = QUESTS.find((q) => q.id === id)!;
  const next: QuestState = {
    ...s,
    progress: { ...s.progress, [id]: Math.min(quest.goal, (s.progress[id] ?? 0) + by) },
  };
  saveQuests(next);
  return next;
}

export function claim(s: QuestState, id: QuestId): QuestState {
  const quest = QUESTS.find((q) => q.id === id)!;
  if (s.claimed.includes(id) || (s.progress[id] ?? 0) < quest.goal) return s;
  const next: QuestState = { ...s, claimed: [...s.claimed, id], gems: s.gems + quest.gems };
  saveQuests(next);
  return next;
}

export const isDone = (s: QuestState, q: Quest) => (s.progress[q.id] ?? 0) >= q.goal;
