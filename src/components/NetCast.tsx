import { useEffect, useState } from "react";

import { playSfx } from "@/lib/sound";

const loot = [
  "/__l5e/assets-v1/25365535-261c-4a49-a6e3-842b94b8a2d8/fish-sardine.png",
  "/__l5e/assets-v1/ffebb842-1d7a-4cd2-9fae-d66883e496e6/fish-mackerel.png",
  "/__l5e/assets-v1/d40f7c1c-8c7f-47ec-89a0-120eaa992bde/fish-tuna.png",
  "/__l5e/assets-v1/c3244a96-c3a8-495b-ac9e-2ece36ee74e6/fish-swordfish.png",
  "/__l5e/assets-v1/67e96dc8-9734-4101-8659-09807e61e0af/fish-turtle.png",
  "/__l5e/assets-v1/4b0616ca-5528-47ea-8c87-3ea157b6de3e/fish-pearl.png",
];

/** Multi-frame net cast: throw → splash → haul, then a small loot burst. */
export function NetCast({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<"throw" | "splash" | "haul">("throw");
  const catchList = loot.slice(0, 3 + Math.floor(Math.random() * 3));

  useEffect(() => {
    playSfx("click", 0.7);
    const a = window.setTimeout(() => setStage("splash"), 750);
    const b = window.setTimeout(() => setStage("haul"), 1500);
    const c = window.setTimeout(onDone, 3200);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.clearTimeout(c);
    };
  }, [onDone]);

  return (
    <div className="net-stage" role="status" aria-live="polite">
      <div className="net-water" />
      <img src="/__l5e/assets-v1/21f152aa-6da2-4e28-9df2-90d8692a372d/net.png" alt="" className={`net-img net-${stage}`} />

      {stage !== "throw" && (
        <>
          <span className="net-ripple" />
          <span className="net-ripple net-ripple-2" />
        </>
      )}

      {stage === "haul" && (
        <ul className="net-loot">
          {catchList.map((src, i) => (
            <li key={src} style={{ animationDelay: `${i * 110}ms` }}>
              <img src={src} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
      )}

      <p className="net-caption">
        {stage === "throw" ? "رمي الشباك..." : stage === "splash" ? "الشباك في الماء..." : "صيد وفير!"}
      </p>
    </div>
  );
}
