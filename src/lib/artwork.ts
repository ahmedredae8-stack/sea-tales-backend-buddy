import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ArtworkPose = {
  id: string;
  category: "ship" | "rocket";
  subject: string;
  pose: "idle" | "cast" | "submerged" | "haul" | "flight" | "explosion" | "fire" | "smoke" | "fade";
  image_path: string;
  created_by: string;
};

export async function isArtworkAdmin() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data } = await supabase.from("user_roles").select("id").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
  return Boolean(data);
}

export async function listArtwork() {
  const { data, error } = await supabase.from("artwork_poses").select("id,category,subject,pose,image_path,created_by").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ArtworkPose[];
}

export async function artworkUrl(path: string) {
  const { data, error } = await supabase.storage.from("game-artwork").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

/** Map of "<itemKey>:<pose>" → signed image URL for admin-published art. */
export const ARTWORK_UPDATED = "island-bay:artwork-updated";

const CACHE_KEY = "bay:artwork-cache";
let memory: Record<string, string> | null = null;
let inflight: Promise<Record<string, string>> | null = null;

function readCache(): Record<string, string> {
  if (memory) return memory;
  try {
    const raw = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "null") as { at: number; map: Record<string, string> } | null;
    if (raw && Date.now() - raw.at < 50 * 60_000) return (memory = raw.map);
  } catch { /* ignore */ }
  return {};
}

async function fetchMap(): Promise<Record<string, string>> {
  const rows = await listArtwork();
  const newest = new Map<string, ArtworkPose>();
  for (const row of rows) { const k = `${row.subject}:${row.pose}`; if (!newest.has(k)) newest.set(k, row); }
  const entries = await Promise.all([...newest].map(async ([k, row]) => [k, await artworkUrl(row.image_path).catch(() => "")] as const));
  const map = Object.fromEntries(entries.filter(([, u]) => u));
  memory = map;
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), map })); } catch { /* ignore */ }
  return map;
}

/** True once admin art is known (cached or fetched), so views can hold back bundled art. */
export function useArtworkMap() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    const cached = readCache();
    if (Object.keys(cached).length) setMap(cached);
    const refresh = async (force = true) => {
      try {
        if (!force && inflight) { const m = await inflight; if (alive) setMap(m); return; }
        inflight = fetchMap();
        const m = await inflight;
        if (alive) setMap(m);
      } catch { /* fall back to bundled art */ } finally { inflight = null; }
    };
    void refresh();
    window.addEventListener(ARTWORK_UPDATED, refresh);
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 180_000);
    return () => {
      alive = false;
      window.removeEventListener(ARTWORK_UPDATED, refresh);
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, []);
  return map;
}