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