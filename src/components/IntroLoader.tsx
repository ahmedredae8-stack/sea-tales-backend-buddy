import { useEffect, useRef, useState } from "react";

import { playSfx } from "@/lib/sound";

const TIPS = [
  "جهّز أسطولك… العواصف لا ترحم",
  "الكنوز تُقسم بالعدل… أو بالسيف",
  "راقب الأفق، السفن المعادية قريبة",
  "رفع الأشرعة… انطلقنا!",
];

export function IntroLoader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [tip, setTip] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const total = 1600;

    const loop = (t: number) => {
      const p = Math.min(100, ((t - t0) / total) * 100);
      setProgress(p);
      setTip(Math.min(TIPS.length - 1, Math.floor((p / 100) * TIPS.length)));
      if (p < 100) raf = requestAnimationFrame(loop);
      else {
        setLeaving(true);
        window.setTimeout(onDone, 420);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  // Browsers block audio before a gesture: play the sting on the first interaction.
  useEffect(() => {
    const fire = () => {
      if (started.current) return;
      started.current = true;
      playSfx("intro", 0.9);
    };
    fire();
    window.addEventListener("pointerdown", fire, { once: true });
    window.addEventListener("keydown", fire, { once: true });
    return () => {
      window.removeEventListener("pointerdown", fire);
      window.removeEventListener("keydown", fire);
    };
  }, []);

  return (
    <div
      className={`intro-screen ${leaving ? "intro-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="جاري تحميل اللعبة"
    >
      <img
        src="/__l5e/assets-v1/cc4c68c1-f2cf-4ab4-be81-1e34ccc7247e/intro.jpg"
        alt="طاقم القراصنة أمام سفينتهم عند الغروب"
        width={1088}
        height={1920}
        className="intro-art"
      />
      <div className="intro-veil" />

      <div className="intro-content">
        <h1 className="intro-title">
          <span>PIRATE</span>
          <span className="intro-title-accent">BAY</span>
        </h1>
        <p className="intro-sub">أسطورة الخليج الذهبي</p>

        <div className="intro-bar" aria-hidden="true">
          <div className="intro-bar-fill" style={{ width: `${progress}%` }}>
            <span className="intro-bar-shine" />
          </div>
        </div>
        <div className="intro-meta">
          <span>{TIPS[tip]}</span>
          <span className="intro-pct">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}
