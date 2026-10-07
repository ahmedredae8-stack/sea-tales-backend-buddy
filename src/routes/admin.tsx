import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { ArtworkStudio } from "@/components/ArtworkStudio";
import { isArtworkAdmin } from "@/lib/artwork";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "استوديو الوضعيات — Island Bay" }, { name: "description", content: "رفع وضعيات السفن والصواريخ للمشرفين." }, { property: "og:title", content: "استوديو الوضعيات — Island Bay" }, { property: "og:description", content: "إدارة صور الوضعيات." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  ssr: false,
  component: AdminPage,
});

function AdminPage() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => { void isArtworkAdmin().then(setOk); }, []);
  return <main className="social-page" dir="rtl"><div className="social-wrap"><header className="social-titlebar"><Link to="/" className="icon-control" aria-label="رجوع"><ArrowRight /></Link><div><span>للمشرفين</span><h1>استوديو الوضعيات</h1></div></header>
    {ok === null ? <p className="dock-loading">جارٍ التحقق…</p> : ok ? <ArtworkStudio /> : <div className="dock-empty"><ShieldAlert size={40} /><strong>هذه الصفحة للمشرفين فقط</strong><span>سجّل الدخول بحساب لديه صلاحية الإدارة.</span></div>}
  </div></main>;
}
