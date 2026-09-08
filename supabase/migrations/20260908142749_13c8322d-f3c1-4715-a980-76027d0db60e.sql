CREATE TABLE public.seller_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nammaspot_id text NOT NULL,
  seller_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  profile jsonb
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

CREATE POLICY "Signed-in users can upload their own media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('seller-avatars', 'product-images', 'story-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Signed-in users can read their own media"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('seller-avatars', 'product-images', 'story-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Signed-in users can update their own media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('seller-avatars', 'product-images', 'story-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('seller-avatars', 'product-images', 'story-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Signed-in users can delete their own media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('seller-avatars', 'product-images', 'story-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE TABLE public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  tamil_name text NOT NULL DEFAULT '',
  slug text NOT NULL,
  blurb text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sellers (
  id text PRIMARY KEY,
  slug text NOT NULL,
  business_name text NOT NULL,
  owner_name text NOT NULL DEFAULT '',
  category_id text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  about text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  price_from numeric NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  delivers_across_city boolean NOT NULL DEFAULT true,
  tags text[] NOT NULL DEFAULT '{}',
  image_url text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id text PRIMARY KEY,
  seller_id text NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'product',
  price numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  views integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customers (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.enquiries (
  id text PRIMARY KEY,
  seller_id text NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id text,
  customer_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  event_date text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews (
  id text PRIMARY KEY,
  seller_id text NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  customer_name text NOT NULL DEFAULT '',
  rating numeric NOT NULL DEFAULT 5,
  comment text NOT NULL DEFAULT '',
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.sellers TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.customers TO service_role;
GRANT ALL ON public.enquiries TO service_role;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_products_seller ON public.products(seller_id);
CREATE INDEX idx_enquiries_seller ON public.enquiries(seller_id);
CREATE INDEX idx_reviews_seller ON public.reviews(seller_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sellers_updated BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_enquiries_updated BEFORE UPDATE ON public.enquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();