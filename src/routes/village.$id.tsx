import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, MessageCircle } from "lucide-react";

import { fetchPlayer, initials, isOnline, type Player } from "@/lib/player";
import { currentPhase, getScene, getTheme } from "@/lib/themes";

export const Route = createFileRoute("/village/$id")({
  head: () => ({
    meta: [
      { title: "زيارة قرية صديق — Island Bay" },
      { name: "description", content: "تجوّل في قرية صديقك داخل خليج الجزيرة وشاهد خلفيته وحالته." },
      { property: "og:title", content: "زيارة قرية صديق — Island Bay" },
      { property: "og:description", content: "شاهد قرية صديقك وخلفيته المختارة وحالة اتصاله." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VillagePage,
});

function VillagePage() {
  const { id } = Route.useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const p = await fetchPlayer(id);
      if (!alive) return;
      setPlayer(p);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const theme = getTheme(player?.theme_id ?? "");
  const scene = getScene(theme, currentPhase());

  if (loading) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[oklch(0.17_0.04_250)]">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--gold)]" />
      </main>
    );
  }

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[oklch(0.17_0.04_250)] text-white" dir="rtl">
      {player && (
        <img
          src={scene.poster}
          alt={`قرية ${player.name} — ${theme.name}`}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/40" />

      <header className="relative flex items-center gap-3 px-4 pt-4">
        <Link to="/friends" aria-label="رجوع للأصدقاء" className="rounded-xl bg-black/40 p-2 backdrop-blur transition hover:bg-black/60">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--gold)] drop-shadow">
          {player ? `قرية ${player.name}` : "قرية غير موجودة"}
        </h1>
      </header>

      {!player ? (
        <div className="relative mx-auto mt-24 max-w-sm rounded-3xl border border-white/15 bg-black/50 p-6 text-center backdrop-blur">
          <p className="text-sm text-white/70">لم نعثر على هذا اللاعب — ربما غادر الخليج.</p>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-xl items-center gap-3 rounded-3xl border border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-black/55 p-4 backdrop-blur-xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-deep)] text-sm font-black text-black">
              {initials(player.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{player.name}</p>
              <p className={`text-xs ${isOnline(player.last_seen) ? "text-emerald-400" : "text-white/50"}`}>
                {isOnline(player.last_seen) ? "متصل الآن" : "غير متصل"} · خلفية: {theme.name}
              </p>
            </div>
            <Link
              to="/chat"
              aria-label="محادثة"
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-deep)] px-3 py-2 text-sm font-bold text-black transition hover:brightness-110"
            >
              <MessageCircle className="h-4 w-4" /> دردشة
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
