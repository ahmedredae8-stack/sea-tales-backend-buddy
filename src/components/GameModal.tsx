import { X } from "lucide-react";
import type { ReactNode } from "react";

import { playSfx } from "@/lib/sound";

type Props = {
  title: string;
  subtitle?: string;
  icon?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
};

/** Floating glass window that sits over the living sea — the scene stays visible around it. */
export function GameModal({ title, subtitle, icon, onClose, children, wide }: Props) {
  return (
    <div
      className="gm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => {
        playSfx("click", 0.4);
        onClose();
      }}
    >
      <div
        dir="rtl"
        className={`gm-window ${wide ? "gm-wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="gm-head">
          {icon && <img src={icon} alt="" className="gm-head-ico" draggable={false} />}
          <div className="gm-head-text">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="إغلاق"
            className="gm-close"
            onClick={() => {
              playSfx("click", 0.5);
              onClose();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="gm-body">{children}</div>
      </div>
    </div>
  );
}
