import { supabase } from "@/integrations/supabase/client";

export type Tribe = {
  id: string;
  name: string;
  emblem: string;
  motto: string;
  score: number;
  owner_id: string;
  created_at: string;
};

export type TribeMember = {
  id: string;
  tribe_id: string;
  player_id: string;
  rank: string;
  contribution: number;
  created_at: string;
};

export type MemberRow = TribeMember & { players: { name: string; avatar_index: number } | null };

export const RANKS = ["member", "officer", "leader"] as const;
export type Rank = (typeof RANKS)[number];

export const rankLabel: Record<string, string> = {
  member: "بحّار",
  officer: "ضابط",
  leader: "قائد",
};

export const EMBLEMS = [
  { id: "skull", src: "/__l5e/assets-v1/02c75f53-86a9-4504-9772-daff6f771381/skull.png" },
  { id: "ship", src: "/__l5e/assets-v1/31f47bd7-8999-4049-8835-3de413357bf2/cat-ship.png" },
  { id: "chest", src: "/__l5e/assets-v1/08453a7e-1779-4eb1-9220-dfabe5462e44/chest.png" },
  { id: "gem", src: "/__l5e/assets-v1/81b9318d-8399-478f-bd28-abec7665a1a6/gem.png" },
];

export function emblemSrc(id: string) {
  return EMBLEMS.find((e) => e.id === id)?.src ?? EMBLEMS[0]!.src;
}

export async function listTribes(): Promise<Tribe[]> {
  const { data } = await supabase.from("tribes").select("*").order("score", { ascending: false }).limit(50);
  return (data as Tribe[]) ?? [];
}

export async function myMembership(playerId: string): Promise<TribeMember | null> {
  const { data } = await supabase.from("tribe_members").select("*").eq("player_id", playerId).maybeSingle();
  return (data as TribeMember) ?? null;
}

export async function listMembers(tribeId: string): Promise<MemberRow[]> {
  const { data } = await supabase
    .from("tribe_members")
    .select("*, players(name, avatar_index)")
    .eq("tribe_id", tribeId)
    .order("contribution", { ascending: false });
  return (data as unknown as MemberRow[]) ?? [];
}

export async function createTribe(playerId: string, name: string, emblem: string, motto: string) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (clean.length < 3 || clean.length > 20) return { error: "اسم القبيلة بين 3 و20 حرفًا" };
  const { data, error } = await supabase
    .from("tribes")
    .insert({ name: clean, emblem, motto: motto.slice(0, 80), owner_id: playerId })
    .select("*")
    .single();
  if (error || !data) return { error: "هذا الاسم محجوز، جرّب اسمًا آخر" };
  const tribe = data as Tribe;
  const { error: joinError } = await supabase
    .from("tribe_members")
    .insert({ tribe_id: tribe.id, player_id: playerId, rank: "leader" });
  if (joinError) return { error: "أنت عضو في قبيلة بالفعل" };
  return { tribe };
}

export async function joinTribe(playerId: string, tribeId: string) {
  const { error } = await supabase.from("tribe_members").insert({ tribe_id: tribeId, player_id: playerId });
  return error ? { error: "أنت عضو في قبيلة بالفعل" } : {};
}

export async function leaveTribe(playerId: string) {
  await supabase.from("tribe_members").delete().eq("player_id", playerId);
}

export async function promoteMember(memberId: string, rank: Rank) {
  await supabase.from("tribe_members").update({ rank }).eq("id", memberId);
}

export async function addContribution(playerId: string, amount: number) {
  const { data } = await supabase
    .from("tribe_members")
    .select("id, tribe_id, contribution")
    .eq("player_id", playerId)
    .maybeSingle();
  if (!data) return;
  const row = data as { id: string; tribe_id: string; contribution: number };
  await supabase.from("tribe_members").update({ contribution: row.contribution + amount }).eq("id", row.id);
  const { data: t } = await supabase.from("tribes").select("score").eq("id", row.tribe_id).maybeSingle();
  if (t) await supabase.from("tribes").update({ score: (t as { score: number }).score + amount }).eq("id", row.tribe_id);
}

/** Daily tribe quests — progress is contributed by playing the bay. */
export const TRIBE_QUESTS = [
  { id: "catch", label: "اصطياد 20 سمكة للقبيلة", reward: 60 },
  { id: "sell", label: "بيع بضاعة بـ 5000 عملة", reward: 90 },
  { id: "sail", label: "3 رحلات إبحار جماعية", reward: 120 },
] as const;
