import bayNightVid from "@/assets/scenes/bay-night.mp4.asset.json";
import bayNightImg from "@/assets/scenes/bay-night.jpg.asset.json";
import bayDayVid from "@/assets/scenes/bay-day.mp4.asset.json";
import bayDayImg from "@/assets/scenes/bay-day.jpg.asset.json";
import bayBurnedVid from "@/assets/scenes/bay-burned.mp4.asset.json";
import bayBurnedImg from "@/assets/scenes/bay-burned.jpg.asset.json";
import springDayVid from "@/assets/scenes/spring-day.mp4.asset.json";
import springDayImg from "@/assets/scenes/spring-day.jpg.asset.json";
import springNightVid from "@/assets/scenes/spring-night.mp4.asset.json";
import springNightImg from "@/assets/scenes/spring-night.jpg.asset.json";
import winterDayVid from "@/assets/scenes/winter-day.mp4.asset.json";
import winterDayImg from "@/assets/scenes/winter-day.jpg.asset.json";
import winterNightVid from "@/assets/scenes/winter-night.mp4.asset.json";
import winterNightImg from "@/assets/scenes/winter-night.jpg.asset.json";
import winterBurnedVid from "@/assets/scenes/winter-burned.mp4.asset.json";
import winterBurnedImg from "@/assets/scenes/winter-burned.jpg.asset.json";
import wallDayVid from "@/assets/scenes/wall-day.mp4.asset.json";
import wallDayImg from "@/assets/scenes/wall-day.jpg.asset.json";
import wallNightVid from "@/assets/scenes/wall-night.mp4.asset.json";
import wallNightImg from "@/assets/scenes/wall-night.jpg.asset.json";
import wallBurnedVid from "@/assets/scenes/wall-burned.mp4.asset.json";
import wallBurnedImg from "@/assets/scenes/wall-burned.jpg.asset.json";
import eiffelDayVid from "@/assets/scenes/eiffel-day.mp4.asset.json";
import eiffelDayImg from "@/assets/scenes/eiffel-day.jpg.asset.json";
import eiffelNightVid from "@/assets/scenes/eiffel-night.mp4.asset.json";
import eiffelNightImg from "@/assets/scenes/eiffel-night.jpg.asset.json";
import eiffelBurnedVid from "@/assets/scenes/eiffel-burned.mp4.asset.json";
import eiffelBurnedImg from "@/assets/scenes/eiffel-burned.jpg.asset.json";

/** Scene media lives on the Lovable CDN. Outside Lovable hosting (e.g. Vercel)
 *  the relative /__l5e path 404s, so always resolve to the absolute CDN origin. */
const CDN_ORIGIN = "https://void-trading-post.lovable.app";

function cdn(url: string) {
  return url.startsWith("/__l5e/") ? CDN_ORIGIN + url : url;
}

export type Phase = "day" | "night";

export type Scene = { video: string; poster: string };

/** Ambient soundtrack key played while a world is on screen. */
export type AmbientKey = "waves" | "night" | "winter" | "wall" | "spring" | "city";

export type Theme = {
  id: string;
  name: string;
  day: Scene;
  night: Scene;
  /** Shown while the bay is under attack. */
  burned?: Scene;
  ambient: { day: AmbientKey; night: AmbientKey };
};

export const themes: Theme[] = [
  {
    id: "spring",
    name: "وادي الربيع",
    day: { video: cdn(springDayVid.url), poster: cdn(springDayImg.url) },
    night: { video: cdn(springNightVid.url), poster: cdn(springNightImg.url) },
    ambient: { day: "spring", night: "night" },
  },
  {
    id: "bay",
    name: "الخليج الأساسي",
    day: { video: cdn(bayDayVid.url), poster: cdn(bayDayImg.url) },
    night: { video: cdn(bayNightVid.url), poster: cdn(bayNightImg.url) },
    burned: { video: cdn(bayBurnedVid.url), poster: cdn(bayBurnedImg.url) },
    ambient: { day: "waves", night: "night" },
  },
  {
    id: "winter",
    name: "الخليج الثلجي",
    day: { video: cdn(winterDayVid.url), poster: cdn(winterDayImg.url) },
    night: { video: cdn(winterNightVid.url), poster: cdn(winterNightImg.url) },
    burned: { video: cdn(winterBurnedVid.url), poster: cdn(winterBurnedImg.url) },
    ambient: { day: "winter", night: "winter" },
  },
  {
    id: "wall",
    name: "سور الصين العظيم",
    day: { video: cdn(wallDayVid.url), poster: cdn(wallDayImg.url) },
    night: { video: cdn(wallNightVid.url), poster: cdn(wallNightImg.url) },
    burned: { video: cdn(wallBurnedVid.url), poster: cdn(wallBurnedImg.url) },
    ambient: { day: "wall", night: "wall" },
  },
  {
    id: "eiffel",
    name: "برج إيفل",
    day: { video: cdn(eiffelDayVid.url), poster: cdn(eiffelDayImg.url) },
    night: { video: cdn(eiffelNightVid.url), poster: cdn(eiffelNightImg.url) },
    burned: { video: cdn(eiffelBurnedVid.url), poster: cdn(eiffelBurnedImg.url) },
    ambient: { day: "city", night: "city" },
  },
];

export const defaultTheme = themes[0]!;

/** Daylight runs 06:00 → 18:00 on the player's own clock, night the other half. */
export const DAY_START_HOUR = 6;
export const NIGHT_START_HOUR = 18;

export function currentPhase(now: Date | number = Date.now()): Phase {
  const d = typeof now === "number" ? new Date(now) : now;
  const h = d.getHours();
  return h >= DAY_START_HOUR && h < NIGHT_START_HOUR ? "day" : "night";
}

/** Milliseconds left before the world flips between day and night. */
export function msUntilNextPhase(now: Date | number = Date.now()): number {
  const d = typeof now === "number" ? new Date(now) : new Date(now.getTime());
  const next = new Date(d);
  next.setMinutes(0, 0, 0);
  const h = d.getHours();
  if (h < DAY_START_HOUR) next.setHours(DAY_START_HOUR);
  else if (h < NIGHT_START_HOUR) next.setHours(NIGHT_START_HOUR);
  else {
    next.setDate(next.getDate() + 1);
    next.setHours(DAY_START_HOUR);
  }
  return Math.max(1000, next.getTime() - d.getTime());
}

export function phaseLabel(p: Phase) {
  return p === "day" ? "النهار" : "الليل";
}

/** "٣ س ٢٤ د" style countdown to the next flip. */
export function phaseCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}س ${m}د` : `${m}د`;
}

export function getScene(theme: Theme, phase: Phase, burning = false): Scene {
  if (burning && theme.burned) return theme.burned;
  return phase === "day" ? theme.day : theme.night;
}

export function getAmbient(theme: Theme, phase: Phase): AmbientKey {
  return phase === "day" ? theme.ambient.day : theme.ambient.night;
}

const KEY = "bay:theme";

export function loadThemeId(): string {
  if (typeof window === "undefined") return defaultTheme.id;
  try {
    const saved = window.localStorage.getItem(KEY);
    return themes.some((t) => t.id === saved) ? saved! : defaultTheme.id;
  } catch {
    return defaultTheme.id;
  }
}

export function saveThemeId(id: string) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) ?? defaultTheme;
}

/** Fixed points of interest inside the scene artwork (all worlds share the composition).
 *  x/y = center in %, w/h = invisible tap-area size in % of the stage. */
export const hotspots = [
  { id: "fish", to: "/fish-market", label: "سوق السمك", x: 13, y: 44, w: 26, h: 20 },
  { id: "ship", to: "/shipyard", label: "سوق السفن", x: 82, y: 37, w: 30, h: 22 },
] as const;
