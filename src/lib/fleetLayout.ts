import { supabase } from "@/integrations/supabase/client";

/** One ship lane: where it waits, where it fishes, and how big the hull draws. */
export type Lane = {
  id: number;
  dockX: number;
  dockY: number;
  fishX: number;
  fishY: number;
  size: number;
};

export const defaultLanes: Lane[] = [
  { id: 1, dockX: 51.1, dockY: 51.2, fishX: 89.8, fishY: 51.8, size: 26 },
  { id: 2, dockX: 34.1, dockY: 56.5, fishX: 88.9, fishY: 58.7, size: 28 },
  { id: 3, dockX: 43.9, dockY: 64.9, fishX: 87.4, fishY: 66.7, size: 30 },
];

const CACHE_KEY = "ib.fleet.layout.v4";
const cacheKey = (themeId: string) => `${CACHE_KEY}.${themeId}`;

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function normalizeLanes(input: unknown): Lane[] {
  if (!Array.isArray(input)) return defaultLanes;
  return defaultLanes.map((fallback, index) => {
    const raw = (input[index] ?? {}) as Record<string, unknown>;
    return {
      id: fallback.id,
      dockX: clamp(raw["dockX"], 0, 100, fallback.dockX),
      dockY: clamp(raw["dockY"], 0, 100, fallback.dockY),
      fishX: clamp(raw["fishX"], 0, 100, fallback.fishX),
      fishY: clamp(raw["fishY"], 0, 100, fallback.fishY),
      size: clamp(raw["size"], 8, 60, fallback.size),
    };
  });
}

/** Instant lanes from the last visit so ships never wait on the network. */
export function cachedLanes(themeId: string): Lane[] {
  if (typeof window === "undefined") return defaultLanes;
  try {
    const raw = window.localStorage.getItem(cacheKey(themeId));
    return raw ? normalizeLanes(JSON.parse(raw)) : defaultLanes;
  } catch {
    return defaultLanes;
  }
}

function cache(themeId: string, lanes: Lane[]) {
  try {
    window.localStorage.setItem(cacheKey(themeId), JSON.stringify(lanes));
  } catch {
    /* storage may be unavailable */
  }
}

/** The published layout every player sees. */
export async function fetchLanes(themeId: string): Promise<Lane[]> {
  const { data: rows, error } = await supabase
    .from("fleet_layout")
    .select("id, lanes")
    .in("id", [themeId, "default"]);
  const data = rows?.find((r) => r.id === themeId) ?? rows?.find((r) => r.id === "default");
  if (error || !data) return cachedLanes(themeId);
  const lanes = normalizeLanes(data.lanes);
  cache(themeId, lanes);
  return lanes;
}

export type SaveResult = "cloud" | "local";


/** Save the layout. It is always kept on this device; when the owner is
 *  signed in it is also published so every player sees the same berths. */
export async function publishLanes(themeId: string, lanes: Lane[]): Promise<SaveResult> {
  const clean = normalizeLanes(lanes);
  cache(themeId, clean);
  try {
    const { error } = await supabase
      .from("fleet_layout")
      .upsert({ id: themeId, lanes: clean }, { onConflict: "id" });
    return error ? "local" : "cloud";
  } catch {
    return "local";
  }
}

/** Save one layout to every ocean at once. */
export async function publishLanesEverywhere(themeIds: string[], lanes: Lane[]): Promise<SaveResult> {
  const clean = normalizeLanes(lanes);
  themeIds.forEach((id) => cache(id, clean));
  try {
    const { error } = await supabase
      .from("fleet_layout")
      .upsert(
        themeIds.map((id) => ({ id, lanes: clean })),
        { onConflict: "id" },
      );
    return error ? "local" : "cloud";
  } catch {
    return "local";
  }
}

