import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { savePlayerId, type Player } from "@/lib/player";

export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, { message: "اسم القبطان يجب أن يكون 3 أحرف على الأقل" })
    .max(16, { message: "اسم القبطان يجب ألا يزيد عن 16 حرفًا" })
    .regex(/^[\p{L}\p{N}_ ]+$/u, { message: "الاسم يقبل الحروف والأرقام والشرطة السفلية فقط" }),
  password: z
    .string()
    .min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" })
    .max(72, { message: "كلمة المرور طويلة جدًا" }),
});

export function normalizeUsername(username: string) {
  return username.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar");
}

/** Deterministic ASCII address derived from the nickname (username-only login). */
async function syntheticEmail(usernameNorm: string) {
  const bytes = new TextEncoder().encode(`islandbay:${usernameNorm}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `captain-${hex.slice(0, 24)}@islandbay.local`;
}

type Result = { player?: Player; error?: string };

export async function signUpCaptain(username: string, password: string, avatar = 0): Promise<Result> {
  const parsed = credentialsSchema.safeParse({ username, password });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  const name = parsed.data.username.trim().replace(/\s+/g, " ");
  const norm = normalizeUsername(name);

  const { data: taken } = await supabase
    .from("players")
    .select("id")
    .eq("username_norm", norm)
    .maybeSingle();
  if (taken) return { error: "هذا الاسم محجوز، جرّب اسمًا آخر" };

  const email = await syntheticEmail(norm);
  const { data: auth, error: authError } = await supabase.auth.signUp({
    email,
    password: parsed.data.password,
  });
  if (authError || !auth.user) {
    return { error: authError?.message.includes("already") ? "هذا الاسم محجوز" : "تعذّر إنشاء الحساب" };
  }

  const { data, error } = await supabase
    .from("players")
    .insert({ name, username_norm: norm, user_id: auth.user.id, avatar_index: avatar })
    .select("*")
    .single();

  if (error) return { error: "هذا الاسم محجوز، جرّب اسمًا آخر" };
  savePlayerId((data as Player).id);
  return { player: data as Player };
}

export async function signInCaptain(username: string, password: string): Promise<Result> {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim());
  const parsed = isEmail
    ? z.object({ username: z.string().trim().max(255), password: credentialsSchema.shape.password }).safeParse({ username, password })
    : credentialsSchema.safeParse({ username, password });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  const norm = normalizeUsername(parsed.data.username);
  const email = isEmail
    ? parsed.data.username.trim().toLowerCase()
    : norm === "admin"
      ? "admin@islandbay.game"
      : await syntheticEmail(norm);
  const { data: auth, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (error || !auth.user) return { error: "الاسم أو كلمة المرور غير صحيحة" };

  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!data) return { error: "لم يتم العثور على قبطان مرتبط بهذا الحساب" };

  savePlayerId((data as Player).id);
  return { player: data as Player };
}

export async function signOutCaptain() {
  await supabase.auth.signOut();
}
