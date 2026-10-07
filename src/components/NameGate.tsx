import { useState } from "react";
import { Anchor, Loader2, Lock, ShieldCheck, User } from "lucide-react";

import { CaptainAvatar } from "@/components/GameSprite";
import { signInCaptain, signUpCaptain } from "@/lib/auth";
import type { Player } from "@/lib/player";
import { playSfx } from "@/lib/sound";

type Mode = "login" | "signup";

/** Username + password window, styled as a floating captain's log over the bay. */
export function NameGate({ onReady }: { onReady: (p: Player) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    playSfx("click", 0.7);
    const res =
      mode === "login"
        ? await signInCaptain(username, password)
        : await signUpCaptain(username, password, avatar);
    setBusy(false);
    if (res.error) return setError(res.error);
    if (res.player) onReady(res.player);
  };

  return (
    <div className="auth-card" dir="rtl">
      <div className="auth-crest">
        <img src="/__l5e/assets-v1/b44ac0a6-9b58-447c-a5ae-2fc774a4f53c/logo.png" alt="" draggable={false} />
      </div>

      <h1 className="auth-title">{mode === "login" ? "عودة القبطان" : "قبطان جديد"}</h1>
      <p className="auth-sub">اسم القبطان وكلمة المرور فقط — الاسم محجوز لك وحدك</p>

      <div className="auth-tabs">
        {(["login", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={mode === m ? "auth-tab auth-tab-on" : "auth-tab"}
            onClick={() => {
              setMode(m);
              setError(null);
              playSfx("hover", 0.3);
            }}
          >
            {m === "login" ? "دخول" : "حساب جديد"}
          </button>
        ))}
      </div>

      {mode === "signup" && (
        <div className="auth-avatars">
          <span className="auth-avatars-label">اختر صورتك</span>
          <div className="auth-avatars-row">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`صورة ${i + 1}`}
                className={i === avatar ? "auth-avatar auth-avatar-on" : "auth-avatar"}
                onClick={() => {
                  setAvatar(i);
                  playSfx("hover", 0.25);
                }}
              >
                <CaptainAvatar seed={i} />
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="auth-form">
        <label className="auth-field">
          <User className="h-4 w-4" />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={mode === "login" ? 255 : 16}
            autoComplete="username"
            dir="auto"
            placeholder={mode === "login" ? "اسم القبطان أو البريد" : "اسم القبطان"}
          />
        </label>
        <label className="auth-field">
          <Lock className="h-4 w-4" />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            maxLength={72}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="كلمة المرور"
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={busy} className="auth-submit" onPointerEnter={() => playSfx("hover", 0.3)}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Anchor className="h-4 w-4" />}
          {mode === "login" ? "أبحر الآن" : "أنشئ الحساب"}
        </button>
      </form>

      <p className="auth-note">
        <ShieldCheck className="h-3.5 w-3.5" />
        لا يمكن لأحد الدخول باسمك — الاسم مرتبط بكلمة مرورك ولا يُسترجع.
      </p>
    </div>
  );
}
