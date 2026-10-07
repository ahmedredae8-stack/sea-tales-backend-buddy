import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, LogOut, Music2, Settings2, ShieldCheck, Waves } from "lucide-react";

import { CaptainAvatar, nameSeed } from "@/components/GameSprite";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/hooks/usePlayer";
import { signOutCaptain } from "@/lib/auth";
import { clearPlayer } from "@/lib/player";
import { isArtworkAdmin } from "@/lib/artwork";
import { isMuted, setMuted, startAmbient } from "@/lib/sound";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "إعدادات القبطان — Island Bay" }, { name: "description", content: "إعدادات حساب القبطان والصوت والحركة في خليج الجزيرة." }, { property: "og:title", content: "إعدادات القبطان — Island Bay" }, { property: "og:description", content: "تحكم في حسابك وتجربة اللعب." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: SettingsPage,
});

export function SettingsPage() {
  const { player } = usePlayer();
  const navigate = useNavigate();
  const [sound, setSound] = useState(true);
  const [motion, setMotion] = useState(true);
  const [contrast, setContrast] = useState(false);
  const [admin, setAdmin] = useState(false);
  useEffect(() => { void isArtworkAdmin().then(setAdmin); }, []);
  useEffect(() => { setSound(!isMuted()); setMotion(localStorage.getItem("ib.motion") !== "off"); setContrast(localStorage.getItem("ib.contrast") === "on"); }, []);
  const toggleSound = () => { const next = !sound; setSound(next); setMuted(!next); if (next) startAmbient(); };
  const toggleMotion = () => { const next = !motion; setMotion(next); localStorage.setItem("ib.motion", next ? "on" : "off"); document.documentElement.classList.toggle("reduce-game-motion", !next); };
  const toggleContrast = () => { const next = !contrast; setContrast(next); localStorage.setItem("ib.contrast", next ? "on" : "off"); document.documentElement.classList.toggle("game-contrast", next); };
  const logout = async () => { await signOutCaptain(); clearPlayer(); void navigate({ to: "/auth", replace: true }); };

  return <main className="social-page" dir="rtl"><div className="social-wrap settings-wrap"><header className="social-titlebar"><Link to="/" className="icon-control" aria-label="رجوع"><ArrowRight /></Link><div><span>غرفة القيادة</span><h1>إعدادات القبطان</h1></div><Settings2 /></header><section className="account-banner"><CaptainAvatar seed={nameSeed(player?.name ?? "قبطان")} /><div><small>الحساب الحالي</small><h2>{player?.name ?? "قبطان الخليج"}</h2><p>هوية القبطان محفوظة ومحمية</p></div><ShieldCheck /></section><section className="settings-panel"><SettingRow icon={<Music2 />} title="أصوات اللعبة" detail="الأمواج والأزرار والمؤثرات" enabled={sound} onToggle={toggleSound} /><SettingRow icon={<Waves />} title="حركة المشهد" detail="حركة الخلفيات والعناصر" enabled={motion} onToggle={toggleMotion} /><SettingRow icon={<Eye />} title="وضوح أعلى" detail="زيادة تباين النصوص واللوحات" enabled={contrast} onToggle={toggleContrast} /></section>{admin && <Link to="/admin" className="dock-tab active" style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>استوديو وضعيات السفن والصواريخ</Link>}<Button variant="destructive" className="logout-button" onClick={logout}><LogOut /> تسجيل الخروج</Button></div></main>;
}

function SettingRow({ icon, title, detail, enabled, onToggle }: { icon: React.ReactNode; title: string; detail: string; enabled: boolean; onToggle: () => void }) {
  return <div className="setting-row"><span className="setting-icon">{icon}</span><div><h3>{title}</h3><p>{detail}</p></div><Button variant="ghost" className={enabled ? "game-switch switch-on" : "game-switch"} onClick={onToggle} aria-label={title}><span /></Button></div>;
}