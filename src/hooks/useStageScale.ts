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
    // Block pinch gestures only within the play-field; retain single-finger scrolling.
    const stopPinch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    const stopGesture = (event: Event) => event.preventDefault();
    host.addEventListener("touchmove", stopPinch, { passive: false });
    host.addEventListener("gesturestart", stopGesture, { passive: false });
    host.addEventListener("gesturechange", stopGesture, { passive: false });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      host.removeEventListener("touchmove", stopPinch);
      host.removeEventListener("gesturestart", stopGesture);
      host.removeEventListener("gesturechange", stopGesture);
    };
  }, [designWidth, designHeight]);

  return ref;
}
