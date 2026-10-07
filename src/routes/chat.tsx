import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Globe2, Loader2, Menu, Send, Users, Shield } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SignInNotice } from "@/components/SignInNotice";
import { usePlayer } from "@/hooks/usePlayer";
import { initials, isOnline, timeLabel, type Message, type Player } from "@/lib/player";
import { playSfx } from "@/lib/sound";
import { myMembership } from "@/lib/tribes";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "دردشة الخليج — Island Bay" },
      { name: "description", content: "دردشة مباشرة بين لاعبي خليج الجزيرة: غرفة عامة ومحادثات خاصة مع الأصدقاء." },
      { property: "og:title", content: "دردشة الخليج — Island Bay" },
      { property: "og:description", content: "غرفة عامة ومحادثات خاصة بين قباطنة الخليج، بالوقت الحقيقي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

const PUBLIC = "public";

export function ChatPage() {
  const { player, loading } = usePlayer();

  if (loading) return <Splash />;
  if (!player) return <Shell><SignInNotice /></Shell>;
  return <Shell><ChatRoom me={player} /></Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100svh] bg-[oklch(0.17_0.04_250)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background:radial-gradient(60%_45%_at_80%_0%,color-mix(in_oklab,var(--sea-light)_28%,transparent),transparent),radial-gradient(50%_40%_at_10%_100%,color-mix(in_oklab,var(--gold)_18%,transparent),transparent)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Splash() {
  return (
    <Shell>
      <div className="flex min-h-[100svh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--gold)]" />
      </div>
    </Shell>
  );
}

function ChatRoom({ me }: { me: Player }) {
  const [friends, setFriends] = useState<Player[]>([]);
  const [active, setActive] = useState<string>(PUBLIC);
  const [messages, setMessages] = useState<Message[]>([]);
  const [people, setPeople] = useState<Record<string, Player>>({ [me.id]: me });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [section, setSection] = useState<"friends" | "public" | "tribe">("public");
  const [tribeMember, setTribeMember] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeFriend = active === PUBLIC ? null : (friends.find((f) => f.id === active) ?? null);
  useEffect(() => { void myMembership(me.id).then((membership) => setTribeMember(Boolean(membership))); }, [me.id]);

  /* friends list ------------------------------------------------------- */
  const loadFriends = useCallback(async () => {
    const { data: links } = await supabase
      .from("friendships")
      .select("requester_id,addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`);

    const ids = (links ?? []).map((l) => (l.requester_id === me.id ? l.addressee_id : l.requester_id));
    if (!ids.length) return setFriends([]);

    const { data: rows } = await supabase.from("players").select("*").in("id", ids);
    const list = (rows ?? []) as Player[];
    setFriends(list);
    setPeople((p) => ({ ...p, ...Object.fromEntries(list.map((r) => [r.id, r])) }));
  }, [me.id]);

  useEffect(() => {
    void loadFriends();
    const t = setInterval(() => void loadFriends(), 60_000);
    return () => clearInterval(t);
  }, [loadFriends]);

  /* messages ----------------------------------------------------------- */
  const belongs = useCallback(
    (m: Message) => {
      if (active === PUBLIC) return m.recipient_id === null;
      return (
        (m.sender_id === me.id && m.recipient_id === active) ||
        (m.sender_id === active && m.recipient_id === me.id)
      );
    },
    [active, me.id],
  );

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    if (section === "tribe") return;
    (async () => {
      let q = supabase.from("messages").select("*").order("created_at", { ascending: true }).limit(200);
      q = active === PUBLIC ? q.is("recipient_id", null) : q.not("recipient_id", "is", null);
      const { data } = await q;
      if (cancelled) return;
      const rows = ((data ?? []) as Message[]).filter(belongs);
      setMessages(rows);
      void hydrate(rows.map((r) => r.sender_id));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, me.id, section]);

  const hydrate = useCallback(
    async (ids: string[]) => {
      const missing = [...new Set(ids)].filter((id) => !people[id]);
      if (!missing.length) return;
      const { data } = await supabase.from("players").select("*").in("id", missing);
      const rows = (data ?? []) as Player[];
      if (rows.length) setPeople((p) => ({ ...p, ...Object.fromEntries(rows.map((r) => [r.id, r])) }));
    },
    [people],
  );

  useEffect(() => {
    const channel = supabase
      .channel("chat-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message;
        if (!belongs(m)) return;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        void hydrate([m.sender_id]);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [belongs, hydrate, section]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [active]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    playSfx("click", 0.4);
    const { error } = await supabase.from("messages").insert({
      sender_id: me.id,
      recipient_id: active === PUBLIC ? null : active,
      body: body.slice(0, 500),
    });
    if (error) setText(body);
    setSending(false);
    inputRef.current?.focus();
  };

  const grouped = useMemo(() => messages, [messages]);

  return (
    <div className="mx-auto flex h-[100svh] max-w-6xl" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-30 w-72 shrink-0 border-l border-white/10 bg-[oklch(0.2_0.045_252)]/95 backdrop-blur-xl transition-transform md:static md:translate-x-0 ${
          sidebar ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="رجوع للقرية">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <span className="text-sm font-bold tracking-wide text-[var(--gold)]">دردشة الخليج</span>
        </div>

        <nav className="space-y-1 px-3 pb-4">
          <ConversationRow
            active={active === PUBLIC}
            title="الغرفة العامة"
            subtitle="كل القباطنة"
            onClick={() => {
              setActive(PUBLIC);
              setSidebar(false);
            }}
            icon={<Globe2 className="h-5 w-5" />}
          />

          <p className="px-2 pb-1 pt-4 text-xs font-semibold text-white/40">الأصدقاء</p>
          {friends.length === 0 && (
            <Link
              to="/friends"
              className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-white/60 transition hover:bg-white/5"
            >
              <Users className="h-4 w-4" /> أضف أصدقاء لبدء محادثة خاصة
            </Link>
          )}
          {friends.map((f) => (
            <ConversationRow
              key={f.id}
              active={active === f.id}
              title={f.name}
              subtitle={isOnline(f.last_seen) ? "متصل الآن" : "غير متصل"}
              online={isOnline(f.last_seen)}
              onClick={() => {
                setActive(f.id);
                setSidebar(false);
              }}
              icon={<Avatar name={f.name} />}
            />
          ))}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar name={me.name} gold />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{me.name}</p>
              <p className="text-xs text-emerald-400">متصل</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebar && (
        <button
          aria-label="إغلاق القائمة"
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* Conversation */}
      <section className="flex min-w-0 flex-1 flex-col">
        <nav className="dock-tabs" aria-label="قنوات الدردشة">
          {([ ["friends", "الأصدقاء", Users], ["public", "العام", Globe2], ["tribe", "القبيلة", Shield] ] as const).map(([id, label, Icon]) => (
            <Button key={id} variant="ghost" className={section === id ? "dock-tab active" : "dock-tab"} onClick={() => { setSection(id); if (id === "public") setActive(PUBLIC); if (id === "friends") setSidebar(true); else setSidebar(false); }}><Icon size={16} />{label}</Button>
          ))}
        </nav>
        {section === "tribe" ? <div className="dock-empty"><Shield size={42} /><strong>{tribeMember ? "دردشة القبيلة" : "لم تنضم إلى قبيلة بعد"}</strong><span>{tribeMember ? "قناة القبيلة غير متاحة بعد." : "انضم إلى قبيلة من نافذتها أولاً."}</span></div> : <>
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 backdrop-blur">
          <button
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 md:hidden"
            onClick={() => setSidebar(true)}
            aria-label="فتح المحادثات"
          >
            <Menu className="h-5 w-5" />
          </button>
          {activeFriend ? <Avatar name={activeFriend.name} /> : <div className="rounded-xl bg-white/10 p-2"><Globe2 className="h-5 w-5" /></div>}
          <div className="min-w-0">
            <h1 className="truncate font-bold">{activeFriend ? activeFriend.name : "الغرفة العامة"}</h1>
            <p className="text-xs text-white/50">
              {activeFriend
                ? isOnline(activeFriend.last_seen)
                  ? "متصل الآن"
                  : "غير متصل"
                : "محادثة مفتوحة لكل اللاعبين"}
            </p>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
          {grouped.length === 0 && (
            <p className="mt-16 text-center text-sm text-white/45">
              لا توجد رسائل بعد — كن أول من يكتب ⚓
            </p>
          )}
          {grouped.map((m, i) => {
            const mine = m.sender_id === me.id;
            const sender = people[m.sender_id];
            const showName = !mine && grouped[i - 1]?.sender_id !== m.sender_id;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                {!mine && (
                  <div className={showName ? "" : "invisible"}>
                    <Avatar name={sender?.name ?? "؟"} small />
                  </div>
                )}
                <div className={`max-w-[78%] ${mine ? "text-left" : "text-right"}`}>
                  {showName && <p className="mb-1 px-1 text-xs text-[var(--gold)]">{sender?.name ?? "لاعب"}</p>}
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-lg ${
                      mine
                        ? "rounded-bl-sm bg-gradient-to-l from-[var(--gold-deep)] to-[var(--gold)] text-black"
                        : "rounded-br-sm bg-white/10 text-white"
                    }`}
                  >
                    <span className="whitespace-pre-wrap break-words">{m.body}</span>
                  </div>
                  <p className="mt-1 px-1 text-[10px] text-white/35">{timeLabel(m.created_at)}</p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 focus-within:border-[var(--gold)]">
            <input
              ref={inputRef}
              value={text}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
              placeholder={activeFriend ? `اكتب إلى ${activeFriend.name}...` : "اكتب رسالة للجميع..."}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-white/35"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              aria-label="إرسال"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-deep)] text-black transition hover:brightness-110 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rotate-180" />}
            </button>
          </div>
        </form>
        </>}
      </section>
    </div>
  );
}

function ConversationRow({
  active,
  title,
  subtitle,
  onClick,
  icon,
  online,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
  icon: React.ReactNode;
  online?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition ${
        active ? "bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] ring-1 ring-[var(--gold)]/40" : "hover:bg-white/5"
      }`}
    >
      <span className="relative">
        {icon}
        {online && <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[oklch(0.2_0.045_252)]" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-white/45">{subtitle}</span>
      </span>
    </button>
  );
}

function Avatar({ name, small, gold }: { name: string; small?: boolean; gold?: boolean }) {
  return (
    <span
      className={`flex items-center justify-center rounded-xl font-bold ${
        small ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-xs"
      } ${gold ? "bg-gradient-to-br from-[var(--gold)] to-[var(--gold-deep)] text-black" : "bg-white/10 text-white"}`}
    >
      {initials(name)}
    </span>
  );
}
