import { supabase } from "@/integrations/supabase/client";

export type Player = {
  id: string;
  name: string;
  theme_id: string;
  last_seen: string;
  created_at: string;
  avatar_index?: number;
  score?: number;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  body: string;
  created_at: string;
};

const KEY = "island.player.id";

export function loadPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function savePlayerId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, id);
}

export function clearPlayer() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/** Fetch the stored player (or null when the row disappeared). */
export async function fetchPlayer(id: string): Promise<Player | null> {
  const { data } = await supabase.from("players").select("*").eq("id", id).maybeSingle();
  return (data as Player) ?? null;
}

/** Create a player with the chosen nickname (fails when taken). */
export async function createPlayer(name: string): Promise<{ player?: Player; error?: string }> {
  const clean = name.trim().replace(/\s+/g, " ");
  if (clean.length < 2 || clean.length > 20) return { error: "الاسم يجب أن يكون بين حرفين و20 حرفًا" };

  const { data, error } = await supabase
    .from("players")
    .insert({ name: clean })
    .select("*")
    .single();

  if (error) {
    return { error: error.code === "23505" ? "هذا الاسم محجوز، جرّب اسمًا آخر" : "تعذّر إنشاء اللاعب" };
  }
  savePlayerId((data as Player).id);
  return { player: data as Player };
}

export async function touchPresence(id: string) {
  await supabase.from("players").update({ last_seen: new Date().toISOString() }).eq("id", id);
}

export function isOnline(lastSeen: string) {
  return Date.now() - new Date(lastSeen).getTime() < 90_000;
}

export function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
}

/** Persist the player's chosen background to their account. */
export async function saveThemeToAccount(id: string, themeId: string) {
  await supabase.from("players").update({ theme_id: themeId }).eq("id", id);
}

/** Persist the captain's chosen default portrait. */
export async function saveAvatarToAccount(id: string, avatarIndex: number) {
  await supabase.from("players").update({ avatar_index: avatarIndex }).eq("id", id);
}
