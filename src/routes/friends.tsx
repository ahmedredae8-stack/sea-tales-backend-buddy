import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Loader2, MessageCircle, Search, UserPlus, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SignInNotice } from "@/components/SignInNotice";
import { usePlayer } from "@/hooks/usePlayer";
import { initials, isOnline, type Friendship, type Player } from "@/lib/player";
import { playSfx } from "@/lib/sound";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "الأصدقاء — Island Bay" },
      { name: "description", content: "أضف أصدقاء في خليج الجزيرة، اقبل الطلبات، شاهد من متصل الآن وزُر قراهم." },
      { property: "og:title", content: "الأصدقاء — Island Bay" },
      { property: "og:description", content: "طلبات صداقة، حالة الاتصال، وزيارة قرى الأصدقاء." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FriendsPage,
});

function FriendsPage() {
  const { player, loading } = usePlayer();

  return (
    <div className="relative min-h-[100svh] bg-[oklch(0.17_0.04_250)] text-white" dir="rtl">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background:radial-gradient(60%_45%_at_20%_0%,color-mix(in_oklab,var(--sea-light)_26%,transparent),transparent),radial-gradient(50%_40%_at_90%_100%,color-mix(in_oklab,var(--gold)_18%,transparent),transparent)]" />
      <div className="relative">
        {loading ? (
          <div className="flex min-h-[100svh] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--gold)]" />
          </div>
        ) : !player ? (
          <SignInNotice />
        ) : (
          <FriendsBoard me={player} />
        )}
      </div>
    </div>
  );
}

type Row = { link: Friendship; other: Player };

function FriendsBoard({ me }: { me: Player }) {
  const [accepted, setAccepted] = useState<Row[]>([]);
  const [incoming, setIncoming] = useState<Row[]>([]);
  const [outgoing, setOutgoing] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: links } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`)
      .order("created_at", { ascending: false });

    const list = (links ?? []) as Friendship[];
    const ids = [...new Set(list.map((l) => (l.requester_id === me.id ? l.addressee_id : l.requester_id)))];
    const { data: rows } = ids.length
      ? await supabase.from("players").select("*").in("id", ids)
      : { data: [] as Player[] };
    const map = Object.fromEntries(((rows ?? []) as Player[]).map((p) => [p.id, p]));

    const build = (f: (l: Friendship) => boolean) =>
      list
        .filter(f)
        .map((link) => ({ link, other: map[link.requester_id === me.id ? link.addressee_id : link.requester_id] }))
        .filter((r): r is Row => Boolean(r.other));

    setAccepted(build((l) => l.status === "accepted"));
    setIncoming(build((l) => l.status === "pending" && l.addressee_id === me.id));
    setOutgoing(build((l) => l.status === "pending" && l.requester_id === me.id));
  }, [me.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("friendship-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return setResults([]);
    setBusy(true);
    const { data } = await supabase
      .from("players")
      .select("*")
      .ilike("name", `%${q}%`)
      .neq("id", me.id)
      .limit(10);
    setResults((data ?? []) as Player[]);
    setBusy(false);
  };

  const known = new Set([...accepted, ...incoming, ...outgoing].map((r) => r.other.id));

  const request = async (other: Player) => {
    playSfx("click", 0.5);
    const { error } = await supabase.from("friendships").insert({ requester_id: me.id, addressee_id: other.id });
    setNote(error ? "تعذّر إرسال الطلب" : `تم إرسال طلب صداقة إلى ${other.name}`);
    setResults((r) => r.filter((p) => p.id !== other.id));
    void load();
  };

  const respond = async (link: Friendship, status: "accepted" | "declined") => {
    playSfx("click", 0.5);
    await supabase.from("friendships").update({ status }).eq("id", link.id);
    void load();
  };

  const remove = async (link: Friendship) => {
    await supabase.from("friendships").delete().eq("id", link.id);
    void load();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-5">
      <header className="mb-5 flex items-center gap-3">
        <Link to="/" aria-label="رجوع للقرية" className="rounded-lg p-2 text-white/70 transition hover:bg-white/10">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--gold)]">الأصدقاء</h1>
        <Link
          to="/chat"
          className="mr-auto flex items-center gap-1.5 rounded-xl border border-[var(--gold)]/40 px-3 py-1.5 text-sm transition hover:bg-white/10"
        >
          <MessageCircle className="h-4 w-4" /> الدردشة
        </Link>
      </header>

      <form onSubmit={search} className="mb-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 focus-within:border-[var(--gold)]">
        <Search className="h-4 w-4 text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن لاعب بالاسم..."
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-white/35"
        />
        <button type="submit" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--gold)]">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "بحث"}
        </button>
      </form>

      {note && <p className="mb-4 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">{note}</p>}

      {results.length > 0 && (
        <Section title="نتائج البحث">
          {results.map((p) => (
            <PlayerCard key={p.id} player={p}>
              {known.has(p.id) ? (
                <span className="text-xs text-white/40">مضاف بالفعل</span>
              ) : (
                <IconBtn label="إضافة صديق" onClick={() => request(p)}>
                  <UserPlus className="h-4 w-4" />
                </IconBtn>
              )}
            </PlayerCard>
          ))}
        </Section>
      )}

      {incoming.length > 0 && (
        <Section title={`طلبات واردة (${incoming.length})`}>
          {incoming.map(({ link, other }) => (
            <PlayerCard key={link.id} player={other}>
              <IconBtn label="قبول" tone="ok" onClick={() => respond(link, "accepted")}>
                <Check className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="رفض" tone="bad" onClick={() => respond(link, "declined")}>
                <X className="h-4 w-4" />
              </IconBtn>
            </PlayerCard>
          ))}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title="طلبات مرسلة">
          {outgoing.map(({ link, other }) => (
            <PlayerCard key={link.id} player={other}>
              <button onClick={() => remove(link)} className="text-xs text-white/50 hover:text-white">
                إلغاء
              </button>
            </PlayerCard>
          ))}
        </Section>
      )}

      <Section title={`أصدقائي (${accepted.length})`}>
        {accepted.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/50">
            لا يوجد أصدقاء بعد — ابحث عن لاعب وأرسل له طلب صداقة.
          </p>
        )}
        {accepted.map(({ link, other }) => (
          <PlayerCard key={link.id} player={other}>
            <Link
              to="/village/$id"
              params={{ id: other.id }}
              aria-label="زيارة القرية"
              className="rounded-xl bg-white/10 p-2 transition hover:bg-white/20"
            >
              🏝️
            </Link>
            <Link
              to="/chat"
              aria-label="محادثة"
              className="rounded-xl bg-white/10 p-2 transition hover:bg-white/20"
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
            <IconBtn label="حذف" tone="bad" onClick={() => remove(link)}>
              <X className="h-4 w-4" />
            </IconBtn>
          </PlayerCard>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-white/45">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function PlayerCard({ player, children }: { player: Player; children: React.ReactNode }) {
  const online = isOnline(player.last_seen);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur transition hover:border-[var(--gold)]/35">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white/20 to-white/5 text-xs font-bold">
        {initials(player.name)}
        {online && <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[oklch(0.17_0.04_250)]" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{player.name}</p>
        <p className={`text-xs ${online ? "text-emerald-400" : "text-white/40"}`}>
          {online ? "متصل الآن" : "غير متصل"}
        </p>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "ok" | "bad";
}) {
  const color =
    tone === "ok"
      ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
      : tone === "bad"
        ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
        : "bg-[var(--gold)]/20 text-[var(--gold)] hover:bg-[var(--gold)]/30";
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`rounded-xl p-2 transition ${color}`}>
      {children}
    </button>
  );
}
