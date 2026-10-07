CREATE TABLE public.fleet_layout (
  id text NOT NULL PRIMARY KEY,
  lanes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.fleet_layout TO anon;
GRANT SELECT, INSERT, UPDATE ON public.fleet_layout TO authenticated;
GRANT ALL ON public.fleet_layout TO service_role;

ALTER TABLE public.fleet_layout ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fleet_layout_select" ON public.fleet_layout FOR SELECT USING (true);
CREATE POLICY "fleet_layout_insert" ON public.fleet_layout FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fleet_layout_update" ON public.fleet_layout FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER fleet_layout_touch BEFORE UPDATE ON public.fleet_layout
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.fleet_layout (id, lanes) VALUES ('default', '[
  {"id":1,"dockX":50,"dockY":57,"fishX":74,"fishY":57,"size":26},
  {"id":2,"dockX":39,"dockY":68,"fishX":68,"fishY":68,"size":28},
  {"id":3,"dockX":41,"dockY":79,"fishX":69,"fishY":79,"size":30}
]'::jsonb);