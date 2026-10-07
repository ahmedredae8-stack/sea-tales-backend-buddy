CREATE TABLE public.tribes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emblem TEXT NOT NULL DEFAULT 'skull',
  motto TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  owner_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribes TO authenticated;
GRANT ALL ON public.tribes TO service_role;
ALTER TABLE public.tribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tribes_select" ON public.tribes FOR SELECT TO authenticated USING (true);
CREATE POLICY "tribes_insert" ON public.tribes FOR INSERT TO authenticated WITH CHECK (public.owns_player(owner_id));
CREATE POLICY "tribes_update" ON public.tribes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tribes_delete" ON public.tribes FOR DELETE TO authenticated USING (public.owns_player(owner_id));

CREATE TABLE public.tribe_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  player_id UUID NOT NULL UNIQUE REFERENCES public.players(id) ON DELETE CASCADE,
  rank TEXT NOT NULL DEFAULT 'member',
  contribution INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribe_members TO authenticated;
GRANT ALL ON public.tribe_members TO service_role;
ALTER TABLE public.tribe_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tribe_members_select" ON public.tribe_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "tribe_members_insert" ON public.tribe_members FOR INSERT TO authenticated WITH CHECK (public.owns_player(player_id));
CREATE POLICY "tribe_members_update" ON public.tribe_members FOR UPDATE TO authenticated USING (public.owns_player(player_id) OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tribe_id AND public.owns_player(t.owner_id))) WITH CHECK (true);
CREATE POLICY "tribe_members_delete" ON public.tribe_members FOR DELETE TO authenticated USING (public.owns_player(player_id) OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tribe_id AND public.owns_player(t.owner_id)));