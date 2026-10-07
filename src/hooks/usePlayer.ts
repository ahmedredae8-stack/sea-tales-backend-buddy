import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { savePlayerId, touchPresence, type Player } from "@/lib/player";

/** Loads the signed-in captain and keeps their presence fresh. */
export function usePlayer() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) {
      setPlayer(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("players").select("*").eq("user_id", userId).maybeSingle();
    if (data) savePlayerId((data as Player).id);
    setPlayer((data as Player) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void refresh();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  useEffect(() => {
    if (!player) return;
    void touchPresence(player.id);
    const t = setInterval(() => void touchPresence(player.id), 45_000);
    return () => clearInterval(t);
  }, [player]);

  return { player, loading, setPlayer, refresh };
}
