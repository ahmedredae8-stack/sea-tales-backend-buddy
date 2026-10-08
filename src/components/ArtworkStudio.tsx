import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Rocket, Search, Ship, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { artworkUrl, listArtwork, type ArtworkPose } from "@/lib/artwork";
import { fleetCatalog } from "@/lib/fleetCatalog";
import { WEAPONS } from "@/lib/items";

const poses = {
  ship: [["idle", "عادية"], ["cast", "رمي الشباك"], ["submerged", "تحت الماء"], ["haul", "لم الشباك"]],
  rocket: [["idle", "استعداد"], ["flight", "تحليق"], ["explosion", "انفجار"], ["fire", "نيران"], ["smoke", "دخان"], ["fade", "تلاشي"]],
} as const;

type Item = { key: string; name: string; info: string; fallback?: string };

const shipItems: Item[] = fleetCatalog.map(s => ({ key: `ship-${s.id}`, name: s.name, info: `${s.price.toLocaleString("ar-EG")} ${s.currency === "coin" ? "عملة" : "جوهرة"}${s.source === "tribe" ? " · قبيلة" : ""}`, fallback: s.hull }));
const rocketItems: Item[] = WEAPONS.map(w => ({ key: w.id, name: w.name, info: `${w.price.toLocaleString("ar-EG")} ${w.currency === "coin" ? "عملة" : "جوهرة"}`, fallback: w.icon }));

export function ArtworkStudio() {
  const [category, setCategory] = useState<"ship" | "rocket">("ship");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>(shipItems[0]!.key);
  const [records, setRecords] = useState<ArtworkPose[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingPose = useRef<ArtworkPose["pose"]>("idle");

  const items = category === "ship" ? shipItems : rocketItems;
  const filtered = useMemo(() => items.filter(i => i.name.includes(query.trim())), [items, query]);
  const item = items.find(i => i.key === selected) ?? items[0]!;

  const refresh = async () => {
    try {
      const rows = await listArtwork();
      setRecords(rows);
      const signed = await Promise.all(rows.map(async row => [row.id, await artworkUrl(row.image_path).catch(() => "")] as const));
      setUrls(Object.fromEntries(signed));
    } catch { setStatus("تعذّر تحميل مكتبة الصور"); }
  };
  useEffect(() => { void refresh(); }, []);

  const poseRecord = (pose: string) => records.find(r => r.subject === item.key && r.pose === pose);

  const pick = (pose: ArtworkPose["pose"]) => { pendingPose.current = pose; fileRef.current?.click(); };

  const upload = async (file: File) => {
    const pose = pendingPose.current;
    if (file.type !== "image/png" || file.size > 5 * 1024 * 1024) { setStatus("اختر صورة PNG شفافة لا تتجاوز 5 ميجابايت"); return; }
    setBusy(pose); setStatus("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setStatus("سجل دخولك أولاً"); setBusy(null); return; }
    const path = `${auth.user.id}/${crypto.randomUUID()}.png`;
    const { error: upErr } = await supabase.storage.from("game-artwork").upload(path, file, { contentType: "image/png" });
    if (upErr) { setStatus("تعذّر رفع الصورة — تأكد من صلاحية المشرف."); setBusy(null); return; }
    const { error } = await supabase.from("artwork_poses").insert({ category, subject: item.key, pose, image_path: path, created_by: auth.user.id });
    if (error) { await supabase.storage.from("game-artwork").remove([path]); setStatus("تعذّر حفظ الوضعية"); setBusy(null); return; }
    const old = poseRecord(pose);
    if (old) { await supabase.from("artwork_poses").delete().eq("id", old.id); await supabase.storage.from("game-artwork").remove([old.image_path]); }
    setStatus(`تم نشر وضعية «${poses[category].find(([p]) => p === pose)?.[1]}» لـ ${item.name}`);
    await refresh(); setBusy(null);
  };

  const remove = async (row: ArtworkPose) => {
    if (!window.confirm("حذف هذه الوضعية والعودة للصورة الأصلية؟")) return;
    const { error } = await supabase.from("artwork_poses").delete().eq("id", row.id);
    if (error) { setStatus("تعذّر حذف الوضعية"); return; }
    await supabase.storage.from("game-artwork").remove([row.image_path]);
    await refresh();
  };

  const switchCat = (c: "ship" | "rocket") => { setCategory(c); setSelected((c === "ship" ? shipItems : rocketItems)[0]!.key); setQuery(""); };

  return <section className="art-studio" aria-label="استوديو الإدارة">
    <div className="art-studio-head"><ImagePlus /><div><small>غرفة المشرف</small><h2>استوديو السفن والصواريخ</h2></div></div>
    <div className="art-mode" role="group" aria-label="النوع">
      <Button variant="ghost" className={category === "ship" ? "active" : ""} onClick={() => switchCat("ship")}><Ship /> سفن ({shipItems.length})</Button>
      <Button variant="ghost" className={category === "rocket" ? "active" : ""} onClick={() => switchCat("rocket")}><Rocket /> صواريخ ({rocketItems.length})</Button>
    </div>
    <label className="art-label"><span style={{ display: "flex", gap: 6, alignItems: "center" }}><Search size={16} /> بحث</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالاسم" /></label>
    <div className="art-library" style={{ maxHeight: 260, overflowY: "auto" }}>
      {filtered.map(i => {
        const thumb = records.find(r => r.subject === i.key && r.pose === "idle");
        const count = records.filter(r => r.subject === i.key).length;
        return <button type="button" key={i.key} className="art-record" onClick={() => setSelected(i.key)} style={{ outline: i.key === item.key ? "2px solid hsl(var(--primary, 45 90% 55%))" : undefined, textAlign: "start" }}>
          <div className="art-record-image"><img src={(thumb && urls[thumb.id]) || i.fallback} alt="" /></div>
          <div><strong>{i.name}</strong><small>{i.info} · {count}/{poses[category].length} وضعيات</small></div>
        </button>;
      })}
    </div>
    <h3>وضعيات: {item.name}</h3>
    <input ref={fileRef} type="file" accept="image/png" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
    <div className="art-library" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
      {poses[category].map(([pose, label]) => {
        const rec = poseRecord(pose);
        return <div key={pose} className="art-record" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className="art-record-image" style={{ width: "100%", height: 100 }}>{rec && urls[rec.id] ? <img src={urls[rec.id]} alt={label} /> : pose === "idle" && item.fallback ? <img src={item.fallback} alt="" style={{ opacity: 0.5 }} /> : <UploadCloud />}</div>
          <strong>{label}</strong><small>{rec ? "منشورة" : "الافتراضية"}</small>
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="sm" disabled={!!busy} onClick={() => pick(pose)}>{busy === pose ? "جارٍ…" : rec ? "استبدال" : "رفع"}</Button>
            {rec && <Button size="icon" variant="ghost" aria-label={`حذف ${label}`} onClick={() => void remove(rec)}><Trash2 /></Button>}
          </div>
        </div>;
      })}
    </div>
    {status && <p className="art-status" role="status">{status}</p>}
  </section>;
}
