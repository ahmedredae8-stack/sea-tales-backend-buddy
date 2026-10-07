import { useEffect, useState } from "react";
import { ImagePlus, Rocket, Ship, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { artworkUrl, listArtwork, type ArtworkPose } from "@/lib/artwork";

const poses = {
  ship: [["idle", "عادية"], ["cast", "رمي الشباك"], ["submerged", "تحت الماء"], ["haul", "لم الشباك"]],
  rocket: [["idle", "استعداد"], ["flight", "تحليق"], ["explosion", "انفجار"], ["fire", "نيران"], ["smoke", "دخان"], ["fade", "تلاشي"]],
} as const;

export function ArtworkStudio() {
  const [category, setCategory] = useState<"ship" | "rocket">("ship");
  const [subject, setSubject] = useState("السفينة 1");
  const [pose, setPose] = useState<ArtworkPose["pose"]>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [records, setRecords] = useState<ArtworkPose[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const rows = await listArtwork();
      setRecords(rows);
      const signed = await Promise.all(rows.map(async row => [row.id, await artworkUrl(row.image_path).catch(() => "")] as const));
      setUrls(Object.fromEntries(signed));
    } catch { setStatus("تعذّر تحميل مكتبة الصور"); }
  };
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const upload = async () => {
    if (!file || !subject.trim() || busy) return;
    if (file.type !== "image/png" || file.size > 5 * 1024 * 1024) { setStatus("اختر صورة PNG لا تتجاوز 5 ميجابايت"); return; }
    setBusy(true); setStatus("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setStatus("سجل دخولك أولاً"); setBusy(false); return; }
    const path = `${auth.user.id}/${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage.from("game-artwork").upload(path, file, { contentType: "image/png" });
    if (uploadError) { setStatus("تعذّر رفع الصورة. تأكد من صلاحية المشرف وحجم الملف."); setBusy(false); return; }
    const { error } = await supabase.from("artwork_poses").insert({ category, subject: subject.trim(), pose, image_path: path, created_by: auth.user.id });
    if (error) {
      await supabase.storage.from("game-artwork").remove([path]);
      setStatus("تعذّر حفظ الوضعية، حاول مجددًا.");
    } else { setFile(null); setStatus("تم حفظ الوضعية"); await refresh(); }
    setBusy(false);
  };
  const remove = async (row: ArtworkPose) => {
    if (!window.confirm("حذف هذه الوضعية؟")) return;
    const { error } = await supabase.from("artwork_poses").delete().eq("id", row.id);
    if (error) { setStatus("تعذّر حذف الوضعية"); return; }
    await supabase.storage.from("game-artwork").remove([row.image_path]);
    await refresh();
  };

  return <section className="art-studio" aria-label="استوديو الوضعيات">
    <div className="art-studio-head"><ImagePlus /><div><small>غرفة المشرف</small><h2>استوديو الوضعيات</h2></div></div>
    <div className="art-mode" role="group" aria-label="نوع الصورة">
      <Button variant="ghost" className={category === "ship" ? "active" : ""} onClick={() => { setCategory("ship"); setPose("idle"); setSubject("السفينة 1"); }}><Ship /> سفن</Button>
      <Button variant="ghost" className={category === "rocket" ? "active" : ""} onClick={() => { setCategory("rocket"); setPose("idle"); setSubject(""); }}><Rocket /> صواريخ</Button>
    </div>
    <label className="art-label">اسم {category === "ship" ? "السفينة" : "الصاروخ"}<input value={subject} maxLength={60} onChange={e => setSubject(e.target.value)} placeholder="اسم العنصر" /></label>
    <div className="art-poses" role="group" aria-label="الوضعية">{poses[category].map(([id, label]) => <Button variant="ghost" key={id} className={pose === id ? "active" : ""} onClick={() => setPose(id)}>{label}</Button>)}</div>
    <label className="art-drop"><input type="file" accept="image/png" onChange={e => setFile(e.target.files?.[0] ?? null)} /><span>{preview ? <img src={preview} alt="معاينة الصورة" /> : <UploadCloud size={32} />}</span><strong>{file?.name ?? "اختر PNG بخلفية شفافة"}</strong><small>حتى 5 ميجابايت · تُعرض الصورة داخل مساحة ثابتة دون قص</small></label>
    <Button className="art-save" onClick={() => void upload()} disabled={busy || !file || !subject.trim()}><ImagePlus /> {busy ? "جارٍ الحفظ…" : "حفظ الوضعية"}</Button>
    {status && <p className="art-status" role="status">{status}</p>}
    <h3>الوضعيات المحفوظة</h3>
    <div className="art-library">{records.length ? records.map(row => <div className="art-record" key={row.id}><div className="art-record-image">{urls[row.id] && <img src={urls[row.id]} alt={`${row.subject} — ${row.pose}`} />}</div><div><strong>{row.subject}</strong><small>{row.category === "ship" ? "سفينة" : "صاروخ"} · {poses[row.category].find(([id]) => id === row.pose)?.[1] ?? row.pose}</small></div><Button variant="ghost" size="icon" aria-label={`حذف ${row.subject}`} onClick={() => void remove(row)}><Trash2 /></Button></div>) : <p className="art-status">لا توجد صور مرفوعة بعد</p>}</div>
  </section>;
}