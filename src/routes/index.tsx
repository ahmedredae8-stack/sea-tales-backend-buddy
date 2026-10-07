import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";

import { IntroLoader } from "@/components/IntroLoader";
import { GameStore } from "@/components/GameStore";
import { AlertsWindow, EnemiesWindow, InventoryWindow, RankingsWindow } from "@/components/DockWindows";
import { TribesPage } from "@/routes/tribes";
import { GameWindow } from "@/components/GameWindow";
import { TradingFloor } from "@/components/TradingFloor";
import { TopHud } from "@/components/TopHud";
import { DailyReward } from "@/components/DailyReward";
import { QuestBoard } from "@/components/QuestBoard";
import { BottomDock, type DockAction } from "@/components/BottomDock";
import { FishingFleet } from "@/components/FishingFleet";
import { CALIB_EVENT } from "@/components/FleetCalibrator";
import { usePlayer } from "@/hooks/usePlayer";
import { useStageScale } from "@/hooks/useStageScale";
import { saveThemeToAccount } from "@/lib/player";
import { isMuted, playAmbient, playSfx, setMuted, stopAllSounds } from "@/lib/sound";
import { FishMarket } from "@/routes/fish-market";
import { Shipyard } from "@/routes/shipyard";
import { ChatPage } from "@/routes/chat";
import { SettingsPage } from "@/routes/settings";
import {
  currentPhase,
  defaultTheme,
  getAmbient,
  getScene,
  getTheme,
  hotspots,
  loadThemeId,
  msUntilNextPhase,
  phaseLabel,
  saveThemeId,
} from "@/lib/themes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "خليج الجزيرة — Island Bay" },
      {
        name: "description",
        content:
          "خليج حي بخلفيات فيديو متحركة ودورة نهار وليل، مع سوق السمك وسوق السفن وشاشة تداول كاملة.",
      },
      { property: "og:title", content: "خليج الجزيرة — Island Bay" },
      {
        property: "og:description",
        content:
          "خليج حي بخلفيات فيديو متحركة ودورة نهار وليل، مع سوق السمك وسوق السفن وشاشة تداول كاملة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** Every destination lives as a floating window over the living sea. */
type Win = "chat" | "settings" | "fish" | "ship" | "trade-fish" | "trade-ship" | "stats" | "bag" | "alerts" | "enemies" | "tribe" | null;

function Index() {
  const stageHost = useStageScale();
  const { player } = usePlayer();
  const [sound, setSound] = useState(true);
  const [intro, setIntro] = useState(true);
  const [themeId, setThemeId] = useState(defaultTheme.id);
  const [shopOpen, setShopOpen] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);
  const [win, setWin] = useState<Win>(null);
  const [phase, setPhase] = useState(currentPhase());

  const theme = getTheme(themeId);
  const scene = getScene(theme, phase);
  const ambient = getAmbient(theme, phase);

  useEffect(() => setThemeId(loadThemeId()), []);

  // Flip the world between day and night on the player's own clock.
  useEffect(() => {
    const t = window.setTimeout(() => setPhase(currentPhase()), msUntilNextPhase() + 500);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (player?.theme_id) {
      setThemeId(player.theme_id);
      saveThemeId(player.theme_id);
    }
  }, [player?.theme_id]);

  const selectTheme = (id: string) => {
    setThemeId(id);
    saveThemeId(id);
    if (player) void saveThemeToAccount(player.id, id);
    setShopOpen(false);
  };

  const finishIntro = useCallback(() => setIntro(false), []);

  // The bed follows whichever world is on screen, day or night.
  useEffect(() => {
    if (intro) return;
    playAmbient(ambient, 0.35);
  }, [intro, ambient]);

  useEffect(() => stopAllSounds, []);

  const toggleSound = () => {
    const next = isMuted();
    setMuted(!next);
    setSound(next);
    if (next) playAmbient(ambient, 0.35);
  };

  const open = (w: Win) => {
    playSfx("click", 0.7);
    setWin(w);
  };

  const handleDockAction = (action: DockAction) => {
    if (action === "chat") open("chat");
    else if (action === "store") setShopOpen(true);
    else if (action === "quests") open("alerts");
    else if (action === "tribe") open("tribe");
    else if (action === "battle") open("enemies");
    else if (action === "bag") open("bag");
    else open("stats");
  };

  return (
    <div className="game-root" ref={stageHost}>
      {/* Soft bleed so wide screens never show bare black bars */}
      <img src={scene.poster} alt="" aria-hidden="true" className="stage-backdrop" />

      <main className="game-stage relative overflow-hidden bg-[oklch(0.15_0.04_250)]">
      {/* Living scene: a looping video shot of the bay, cropped to always cover */}
      <div className="scene-stage">
        <video
          key={scene.video}
          className="scene-video"
          src={scene.video}
          poster={scene.poster}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />

        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-label={h.label}
            className="hotspot"
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
            onPointerEnter={() => playSfx("hover", 0.3)}
            onClick={() => open(h.id === "fish" ? "fish" : "ship")}
          >
            <span className="hotspot-ring" />
          </button>
        ))}
        <FishingFleet themeId={themeId} themeName={theme.name} />
      </div>

      {/* Top HUD */}
      <div className="absolute inset-x-0 top-0 z-10 px-1 pt-[max(0.35rem,env(safe-area-inset-top))]">
        <TopHud
          name={player?.name ?? "قبطان"}
          onAvatarClick={() => open("settings")}
          onGiftClick={() => setQuestsOpen(true)}
          onTopUp={() => { playSfx("click", 0.7); setShopOpen(true); }}
        />
      </div>

      {/* Controls */}
      <div className="absolute left-3 top-[max(4.5rem,calc(env(safe-area-inset-top)+4.2rem))] z-10 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={toggleSound}
          aria-label={sound ? "كتم الصوت" : "تشغيل الصوت"}
          className="ctl-btn"
        >
          <img src={sound ? "/__l5e/assets-v1/e24c9aca-fd04-4d5a-be7b-20f0b53a804c/sound-on.png" : "/__l5e/assets-v1/8ee818c7-e155-4144-8305-1820d57e279a/sound-off.png"} alt="" className="h-6 w-6 object-contain" />
        </button>
        <button
          type="button"
          className="phase-chip"
          onClick={() => window.dispatchEvent(new CustomEvent(CALIB_EVENT))}
          aria-label={phaseLabel(phase)}
        >
          {phase === "day" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {phaseLabel(phase)}
        </button>
      </div>

      <BottomDock onAction={handleDockAction} />

       {shopOpen && <GameStore activeId={themeId} onSelect={selectTheme} onClose={() => setShopOpen(false)} />}

      {questsOpen && (
        <div className="daily-overlay" role="dialog" aria-label="المهام اليومية">
          <div className="w-full max-w-md">
            <QuestBoard />
            <button
              type="button"
              onClick={() => {
                playSfx("click", 0.6);
                setQuestsOpen(false);
              }}
              className="daily-claim"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {win === "chat" && (
        <GameWindow title="الدردشة" hint="تحدث مع القباطنة" size="lg" onClose={() => setWin(null)}>
          <ChatPage />
        </GameWindow>
      )}
       {win === "stats" && <GameWindow title="سجل القباطنة" size="lg" onClose={() => setWin(null)}><RankingsWindow /></GameWindow>}
       {win === "bag" && <GameWindow title="مخزن العتاد" size="lg" onClose={() => setWin(null)}><InventoryWindow player={player} /></GameWindow>}
       {win === "alerts" && <GameWindow title="التنبيهات" size="lg" onClose={() => setWin(null)}><AlertsWindow /></GameWindow>}
       {win === "enemies" && <GameWindow title="قائمة الأعداء" size="lg" onClose={() => setWin(null)}><EnemiesWindow /></GameWindow>}
       {win === "tribe" && <GameWindow title="القبيلة" size="xl" onClose={() => setWin(null)}><TribesPage /></GameWindow>}
      {win === "settings" && (
        <GameWindow title="الإعدادات" size="md" onClose={() => setWin(null)}>
          <SettingsPage />
        </GameWindow>
      )}
      {win === "fish" && (
        <GameWindow title="سوق السمك" hint="بع صيدك وطوّر شباكك" size="lg" onClose={() => setWin(null)}>
          <FishMarket />
        </GameWindow>
      )}
      {win === "ship" && (
        <GameWindow title="سوق السفن" hint="اشترِ وطوّر أسطولك" size="lg" onClose={() => setWin(null)}>
          <Shipyard />
        </GameWindow>
      )}
      {(win === "trade-fish" || win === "trade-ship") && (
        <GameWindow title="قاعة التداول" hint="أسعار حيّة وأوامر شراء وبيع" size="xl" onClose={() => setWin(null)}>
          <TradingFloor start={win === "trade-fish" ? "fish" : "ship"} />
        </GameWindow>
      )}

      {!intro && <DailyReward />}

      {intro && <IntroLoader onDone={finishIntro} />}
      </main>
    </div>
  );
}
