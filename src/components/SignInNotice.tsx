import { Link } from "@tanstack/react-router";
import { Anchor } from "lucide-react";

export function SignInNotice() {
  return <div className="dock-empty" style={{ minHeight: "60svh" }}><Anchor size={40} /><strong>يجب تسجيل الدخول أولاً</strong><span>سجّل دخولك من بوابة القبطان قبل دخول البحر.</span><Link to="/auth" className="dock-tab active">بوابة الدخول</Link></div>;
}
