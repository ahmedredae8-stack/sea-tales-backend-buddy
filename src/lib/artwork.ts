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
export function useArtworkMap() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const rows = await listArtwork();
        const entries: [string, string][] = [];
        for (const row of rows) {
          const key = `${row.subject}:${row.pose}`;
          if (entries.some(([k]) => k === key)) continue; // newest wins
          const url = await artworkUrl(row.image_path).catch(() => "");
          if (url) entries.push([key, url]);
        }
        if (alive) setMap(Object.fromEntries(entries));
      } catch { /* fall back to bundled art */ }
    })();
    return () => { alive = false; };
  }, []);
  return map;
}