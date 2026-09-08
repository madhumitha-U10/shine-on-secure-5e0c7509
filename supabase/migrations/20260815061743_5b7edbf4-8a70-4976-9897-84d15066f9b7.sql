CREATE TABLE public.seller_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nammaspot_id text NOT NULL,
  seller_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX seller_accounts_nammaspot_id_key ON public.seller_accounts (lower(nammaspot_id));

GRANT SELECT, INSERT, UPDATE ON public.seller_accounts TO authenticated;
GRANT ALL ON public.seller_accounts TO service_role;

ALTER TABLE public.seller_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own account" ON public.seller_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Sellers can create own account" ON public.seller_accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sellers can update own account" ON public.seller_accounts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.nammaspot_id_available(_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.seller_accounts WHERE lower(nammaspot_id) = lower(trim(_id))
  );
$$;

GRANT EXECUTE ON FUNCTION public.nammaspot_id_available(text) TO anon, authenticated;