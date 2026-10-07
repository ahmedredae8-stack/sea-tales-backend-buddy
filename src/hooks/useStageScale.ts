import { useEffect, useRef } from "react";

/**
 * Keeps the fixed-size play-field proportional: everything inside the stage
 * (ships, HUD, dock, windows) grows and shrinks together with the screen.
 */
export function useStageScale(designWidth = 704, designHeight = 1504) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    const fit = () => {
      const scale = Math.min(host.clientWidth / designWidth, host.clientHeight / designHeight);
      if (Number.isFinite(scale) && scale > 0) host.style.setProperty("--stage-scale", String(scale));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, [designWidth, designHeight]);

  return ref;
}
