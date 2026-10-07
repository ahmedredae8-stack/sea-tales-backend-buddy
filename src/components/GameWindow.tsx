import { X } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

import { playSfx } from "@/lib/sound";

type Props = {
  title: string;
  hint?: string;
  onClose: () => void;
  children: ReactNode;
  /** Full-bleed windows (chat, trading floor) get more room. */
  size?: "md" | "lg" | "xl";
};

/**
 * Every destination in the game is a floating window over the living sea —
 * never a separate page. Embedded screens keep their own markup; `.win-embed`
 * strips their page chrome (full-height, opaque background) so the scene keeps
 * breathing behind the glass.
 */
export function GameWindow({ title, hint, onClose, children, size = "lg" }: Props) {
  const close = () => {
    playSfx("click", 0.5);
    onClose();
  };

  // Screens rendered inside a window still carry their old "back to /" link.
  // Treat that as "close the window" instead of a navigation.
  const interceptBack = (e: MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (anchor && anchor.getAttribute("href") === "/") {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  return (
    <div className="win-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={close}>
      <section
        dir="rtl"
        className={`win-frame win-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="win-head">
          <div className="win-title">
            <h2>{title}</h2>
            {hint && <p>{hint}</p>}
          </div>
          <button type="button" className="win-close" aria-label="إغلاق" onClick={close}>
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="win-embed" onClickCapture={interceptBack}>
          {children}
        </div>
      </section>
    </div>
  );
}
