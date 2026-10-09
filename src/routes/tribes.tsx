import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Crown, Flag, Loader2, LogOut, Plus, Shield, Swords, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CaptainAvatar } from "@/components/GameSprite";
import { usePlayer } from "@/hooks/usePlayer";
import { playSfx } from "@/lib/sound";
import {
  EMBLEMS,
  TRIBE_QUESTS,
  addContribution,
  createTribe,
  emblemSrc,
  joinTribe,
  leaveTribe,
  listMembers,
  listTribes,
  myMembership,
  promoteMember,
  rankLabel,
  type MemberRow,
  type Tribe,
  type TribeMember,
} from "@/lib/tribes";

export const Route = createFileRoute("/tribes")({
  head: () => ({
    meta: [
      { title: "القبائل — خليج الجزيرة" },
      { name: "description", content: "انضم إلى قبيلة، ارتقِ في الرتب، أنجز مهام القبيلة وتصدّر قائمة القادة في خليج الجزيرة." },
      { property: "og:title", content: "القبائل — خليج الجزيرة" },
      { property: "og:description", content: "قبائل القراصنة: انضمام، ترقيات، مهام يومية وقائمة متصدرين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TribesPage,
});

export function TribesPage() {
  const { player } = usePlayer();
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [mine, setMine] = useState<TribeMember | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [motto, setMotto] = useState("");
  const [emblem, setEmblem] = useState(EMBLEMS[0]?.id ?? "skull");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listTribes();
      setTribes(list);
      if (player) {
        const m = await myMembership(player.id);
        setMine(m);
        setMembers(m ? await listMembers(m.tribe_id) : []);
      } else { setMine(null); setMembers([]); }
    } catch { setError("تعذّر تحميل القبائل. حاول مرة أخرى."); }
    finally { setLoading(false); }
  }, [player]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const myTribe = mine ? tribes.find((t) => t.id === mine.tribe_id) ?? null : null;
  const isLeader = !!(player && myTribe && myTribe.owner_id === player.id);

  const doCreate = async () => {
    if (!player) return;
    setError(null);
    playSfx("click", 0.7);
    const res = await createTribe(player.id, name, emblem, motto);
    if (res.error) return setError(res.error);
    setCreating(false);
    setName("");
    setMotto("");
    void refresh();
  };

  return (
    <main className="social-page" dir="rtl">
      <div className="social-wrap">
        <header className="social-titlebar">
          <Link to="/" className="icon-control" aria-label="رجوع">
            <ArrowRight />
          </Link>
          <div>
            <span>تحالفات البحر</span>
            <h1>القبائل</h1>
          </div>
          <Swords />
        </header>

        {error && <div className="social-error" role="alert">{error}<Button variant="ghost" onClick={() => void refresh()}>إعادة المحاولة</Button></div>}
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-game-gold" />
          </div>
        ) : (
          <>
            {myTribe ? (
              <section className="tribe-hero">
                <img src={emblemSrc(myTribe.emblem)} alt="" className="tribe-hero-emblem" />
                <div className="tribe-hero-text">
                  <h2>{myTribe.name}</h2>
                  <p>{myTribe.motto || "قبيلة بلا شعار… بعد"}</p>
                  <span className="tribe-rank">
                    <Shield className="h-3.5 w-3.5" /> رتبتك: {rankLabel[(mine?.rank ?? "member")] ?? (mine?.rank ?? "member")} · مساهمتك{" "}
                    {mine?.contribution ?? 0}
                  </span>
                </div>
                <Button variant="ghost"
                  type="button"
                  className="tribe-leave"
                  onClick={async () => {
                    playSfx("click", 0.6);
                    if (player) await leaveTribe(player.id);
                    void refresh();
                  }}
                >
                  <LogOut className="h-4 w-4" /> مغادرة
                </Button>
              </section>
            ) : (
              <section className="tribe-hero tribe-hero-empty">
                <Flag className="h-8 w-8 text-game-gold" />
                <div className="tribe-hero-text">
                  <h2>لا قبيلة لك بعد</h2>
                  <p>انضم لقبيلة من القائمة أو أسّس قبيلتك وقُد أسطولك.</p>
                </div>
                <Button variant="ghost" type="button" className="tribe-create" onClick={() => setCreating((v) => !v)} disabled={!player}>
                  <Plus className="h-4 w-4" /> تأسيس قبيلة
                </Button>
              </section>
            )}

            {creating && !myTribe && (
              <section className="tribe-form">
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} aria-label="اسم القبيلة" placeholder="اسم القبيلة" />
                <input value={motto} onChange={(e) => setMotto(e.target.value)} maxLength={80} aria-label="شعار القبيلة" placeholder="شعار القبيلة" />
                <div className="tribe-emblems">
                  {EMBLEMS.map((e) => (
                    <Button variant="ghost"
                      key={e.id}
                      type="button"
                      aria-label={e.id}
                      className={e.id === emblem ? "tribe-emblem tribe-emblem-on" : "tribe-emblem"}
                      onClick={() => setEmblem(e.id)}
                    >
                      <img src={e.src} alt="" />
                    </Button>
                  ))}
                </div>
                {error && <p className="auth-error">{error}</p>}
                <Button variant="ghost" type="button" className="auth-submit" onClick={doCreate}>
                  إنشاء القبيلة
                </Button>
              </section>
            )}

            {myTribe && (
              <>
                <section className="tribe-block">
                  <h3>
                    <Trophy className="h-4 w-4" /> مهام القبيلة اليومية
                  </h3>
                  <ul className="tribe-quests">
                    {TRIBE_QUESTS.map((q) => (
                      <li key={q.id}>
                        <span>{q.label}</span>
                        <Button variant="ghost"
                          type="button"
                          onClick={async () => {
                            playSfx("click", 0.65);
                            if (player) await addContribution(player.id, q.reward);
                            void refresh();
                          }}
                        >
                          +{q.reward}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="tribe-block">
                  <h3>
                    <Shield className="h-4 w-4" /> الأعضاء
                  </h3>
                  <ul className="tribe-members">
                    {members.map((m) => (
                      <li key={m.id}>
                        <CaptainAvatar seed={m.players?.avatar_index ?? 0} className="tribe-member-face" />
                        <div>
                          <strong>{m.players?.name ?? "قبطان"}</strong>
                          <small>
                            {rankLabel[m.rank] ?? m.rank} · {m.contribution} نقطة
                          </small>
                        </div>
                        {isLeader && m.rank !== "leader" && (
                          <Button variant="ghost"
                            type="button"
                            onClick={async () => {
                              playSfx("click", 0.6);
                              await promoteMember(m.id, m.rank === "member" ? "officer" : "member");
                              void refresh();
                            }}
                          >
                            <Crown className="h-3.5 w-3.5" />
                            {m.rank === "member" ? "ترقية" : "تخفيض"}
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            <section className="tribe-block">
              <h3>
                <Trophy className="h-4 w-4" /> قائمة القادة
              </h3>
              <ul className="tribe-board">
                {tribes.map((t, i) => (
                  <li key={t.id}>
                    <span className={`tribe-place tribe-place-${Math.min(i + 1, 4)}`}>{i + 1}</span>
                    <img src={emblemSrc(t.emblem)} alt="" />
                    <div>
                      <strong>{t.name}</strong>
                      <small>{t.motto || "—"}</small>
                    </div>
                    <b>{t.score}</b>
                    {player && !mine && (
                      <Button variant="ghost"
                        type="button"
                        onClick={async () => {
                          playSfx("click", 0.65);
                          await joinTribe(player.id, t.id);
                          void refresh();
                        }}
                      >
                        انضمام
                      </Button>
                    )}
                  </li>
                ))}
                {tribes.length === 0 && <p className="tribe-empty">لا توجد قبائل بعد — كن أول مؤسس.</p>}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
