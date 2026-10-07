import { useEffect, useRef, useState } from "react";
import { Grip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hulls, type ShipPose } from "@/lib/fleetCatalog";
import { defaultLanes, publishLanes, publishLanesEverywhere, type Lane } from "@/lib/fleetLayout";
import { themes } from "@/lib/themes";
import { playSfx } from "@/lib/sound";

/** The day/night badge quietly asks for the owner tool through this event. */
export const CALIB_EVENT = "ib:calibrator-open";

const SECRET = "123";

type Props = {
  lanes: Lane[];
  themeId: string;
  themeName: string;
  onChange: (lanes: Lane[]) => void;
  onTest: () => void;
  hullIndex: number;
  onHullChange: (index: number) => void;
  spray: boolean;
  onSprayChange: (on: boolean) => void;
  pose: ShipPose | null;
  onPoseChange: (pose: ShipPose | null) => void;
};

const poseTabs: { key: ShipPose; label: string }[] = [
  { key: "idle", label: "عادية" },
  { key: "cast", label: "رمي الشباك" },
  { key: "submerged", label: "تحت الماء" },
  { key: "haul", label: "لم الشباك" },
];

type Grab = { index: number; kind: "dock" | "fish" };

/** Hidden owner tool: tap the invisible corner, enter 123, then drag each ship's
 *  berth and fishing mark. Publishing stores the layout for every player. */
export function FleetCalibrator({ lanes, onChange, onTest, themeId, themeName, hullIndex, onHullChange, spray, onSprayChange, pose, onPoseChange }: Props) {
  const [stage, setStage] = useState<"hidden" | "gate" | "open">("hidden");
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState("");
  const [exported, setExported] = useState("");
  const layer = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const grab = useRef<Grab | null>(null);
  const panelGrab = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);

  const dragPanel = (event: React.PointerEvent) => {
    const held = panelGrab.current;
    const host = layer.current;
    const box = host?.getBoundingClientRect();
    const pane = panel.current?.getBoundingClientRect();
    if (!held || held.pointerId !== event.pointerId || !box || !pane || !host) return;
    const scaleX = box.width / host.offsetWidth;
    const scaleY = box.height / host.offsetHeight;
    setPanelPosition({
      x: Math.max(0, Math.min(host.offsetWidth - pane.width / scaleX, (event.clientX - box.left - held.x) / scaleX)),
      y: Math.max(0, Math.min(host.offsetHeight - pane.height / scaleY, (event.clientY - box.top - held.y) / scaleY)),
    });
  };

  const move = (event: React.PointerEvent) => {
    const held = grab.current;
    const box = layer.current?.getBoundingClientRect();
    if (!held || !box || box.width === 0) return;
    const x = Math.min(100, Math.max(0, ((event.clientX - box.left) / box.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - box.top) / box.height) * 100));
    onChange(
      lanes.map((lane, index) =>
        index !== held.index
          ? lane
          : held.kind === "dock"
            ? { ...lane, dockX: Math.round(x * 10) / 10, dockY: Math.round(y * 10) / 10 }
            : { ...lane, fishX: Math.round(x * 10) / 10, fishY: Math.round(y * 10) / 10 },
      ),
    );
  };

  const start = (event: React.PointerEvent, index: number, kind: "dock" | "fish") => {
    grab.current = { index, kind };
    setActive(index);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resize = (index: number, size: number) => {
    onChange(lanes.map((lane, i) => (i === index ? { ...lane, size } : lane)));
  };

  useEffect(() => {
    const open = () => setStage((current) => (current === "hidden" ? "gate" : current));
    window.addEventListener(CALIB_EVENT, open);
    return () => window.removeEventListener(CALIB_EVENT, open);
  }, []);

  const publish = async () => {
    setStatus("جاري الحفظ…");
    const result = await publishLanes(themeId, lanes);
    setStatus(result === "cloud" ? `تم الحفظ لمحيط ${themeName} لكل اللاعبين ✔` : `حُفظ على جهازك فقط — سجّل دخولك بحساب الأدمن لينشر للجميع`);
    playSfx("click", 0.6);
  };

  const publishAll = async () => {
    setStatus("جاري الحفظ لكل المحيطات…");
    const result = await publishLanesEverywhere(themes.map((t) => t.id), lanes);
    setStatus(result === "cloud" ? "تم الحفظ على كل الخلفيات لكل اللاعبين ✔" : "حُفظ على جهازك فقط — سجّل دخولك بحساب الأدمن لينشر للجميع");
    playSfx("click", 0.6);
  };


  if (stage === "hidden") return null;

  if (stage === "gate") {
    return (
      <div className="calib-gate" dir="rtl">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim() === SECRET) {
              setStage("open");
              setWrong(false);
              playSfx("click", 0.6);
            } else {
              setWrong(true);
            }
            setCode("");
          }}
        >
          <strong>أدخل كلمة السر</strong>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={8}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-label="كلمة السر"
          />
          {wrong && <span className="calib-note">كلمة السر غير صحيحة</span>}
          <Button type="submit">فتح</Button>
          <Button type="button" variant="secondary" onClick={() => setStage("hidden")}>
            إلغاء
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div
      className="calib-layer"
      ref={layer}
      dir="rtl"
      onPointerMove={move}
      onPointerUp={() => {
        grab.current = null;
      }}
      onPointerCancel={() => {
        grab.current = null;
      }}
    >
      {lanes.map((lane) => (
        <div key={lane.id} className="calib-lane" aria-hidden="true">
          <span
            className="calib-line"
            style={{
              left: `${lane.dockX}%`,
              top: `${lane.dockY}%`,
              width: `${Math.hypot(lane.fishX - lane.dockX, lane.fishY - lane.dockY)}%`,
              rotate: `${(Math.atan2(lane.fishY - lane.dockY, lane.fishX - lane.dockX) * 180) / Math.PI}deg`,
            }}
          />
        </div>
      ))}

      {lanes.map((lane, index) => (
        <div key={`pins-${lane.id}`}>
          <button
            type="button"
            className={`calib-pin calib-pin-dock ${active === index ? "calib-pin-active" : ""}`}
            style={{ left: `${lane.dockX}%`, top: `${lane.dockY}%` }}
            onPointerDown={(event) => start(event, index, "dock")}
            aria-label={`نقطة رسو السفينة ${lane.id}`}
          >
            {lane.id}م
          </button>
          <button
            type="button"
            className={`calib-pin calib-pin-fish ${active === index ? "calib-pin-active" : ""}`}
            style={{ left: `${lane.fishX}%`, top: `${lane.fishY}%` }}
            onPointerDown={(event) => start(event, index, "fish")}
            aria-label={`نقطة صيد السفينة ${lane.id}`}
          >
            {lane.id}ص
          </button>
        </div>
      ))}

       <section className={panelPosition ? "calib-panel calib-panel-moved" : "calib-panel"} ref={panel} style={panelPosition ? { left: panelPosition.x, top: panelPosition.y, bottom: "auto" } : undefined}>
         <div className="calib-drag-handle"
           onPointerDown={(event) => {
             const rect = panel.current?.getBoundingClientRect();
             if (!rect) return;
             panelGrab.current = { pointerId: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top };
             event.currentTarget.setPointerCapture(event.pointerId);
           }}
           onPointerMove={dragPanel}
           onPointerUp={() => { panelGrab.current = null; }}
           onPointerCancel={() => { panelGrab.current = null; }}
         ><h3>معايرة الأسطول · {themeName}</h3><Grip size={18} aria-hidden="true" /></div>
        <p className="calib-note">اسحب الدائرة الذهبية لمكان الرسو والزرقاء لمكان الصيد.</p>
        <div className="calib-row">
          {lanes.map((lane, index) => (
            <Button
              key={lane.id}
              size="sm"
              variant={active === index ? "default" : "secondary"}
              onClick={() => setActive(index)}
            >
              سفينة {lane.id}
            </Button>
          ))}
        </div>
        <div className="calib-row">
          <label>
            الحجم
            <input
              type="range"
              min={8}
              max={60}
              step={1}
              value={lanes[active]?.size ?? 26}
              onChange={(event) => resize(active, Number(event.target.value))}
            />
          </label>
          <span className="calib-note">{lanes[active]?.size ?? 26}%</span>
        </div>
        <div className="calib-row calib-hulls">
          {hulls.map((hull, index) => (
            <button
              key={index}
              type="button"
              className={`calib-hull ${hullIndex === index ? "calib-hull-active" : ""}`}
              onClick={() => onHullChange(index)}
              aria-label={`السفينة ${index + 1}`}
            >
              <img src={hull} alt="" draggable={false} />
              <span>{index + 1}</span>
            </button>
          ))}
        </div>
        <div className="calib-row">
          {poseTabs.map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              variant={pose === tab.key ? "default" : "secondary"}
              onClick={() => onPoseChange(pose === tab.key ? null : tab.key)}
            >
              {tab.label}
            </Button>
          ))}
          <Button size="sm" variant={spray ? "default" : "secondary"} onClick={() => onSprayChange(!spray)}>
            الرذاذ: {spray ? "مفعّل" : "متوقف"}
          </Button>
        </div>
        <div className="calib-row">
          <Button size="sm" onClick={onTest}>
            تجربة الإبحار
          </Button>
          <Button size="sm" onClick={() => void publish()}>
            حفظ لهذا المحيط
          </Button>
          <Button size="sm" onClick={() => void publishAll()}>
            حفظ لكل المحيطات
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const text = JSON.stringify(lanes, null, 2);
              setExported(text);
              void navigator.clipboard?.writeText(text).catch(() => undefined);
              setStatus("تم نسخ الإحداثيات — أرسلها لي لأجعلها افتراضية");
            }}
          >
            نسخ الإحداثيات
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onChange(defaultLanes)}>
            استرجاع الافتراضي
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setStage("hidden")}>
            إغلاق
          </Button>
        </div>
        {status && <span className="calib-note">{status}</span>}
        {exported && (
          <textarea
            readOnly
            dir="ltr"
            value={exported}
            onFocus={(e) => e.currentTarget.select()}
            style={{ width: "100%", height: "7rem", fontSize: 11, fontFamily: "monospace" }}
          />
        )}
      </section>
    </div>
  );
}
