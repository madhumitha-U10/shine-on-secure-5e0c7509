INSERT INTO public.categories (id, name, tamil_name, slug, blurb) VALUES
('c1','Home Bakers','வீட்டு பேக்கிங்','home-bakers','Custom cakes, brownies and teatime bakes from home kitchens.'),
('c2','Mehendi Artists','மருதாணி','mehendi','Bridal and festive henna, booked directly with the artist.'),
('c3','Makeup & Bridal','மேக்கப்','makeup-bridal','Muhurtham, reception and engagement styling.'),
('c4','Crochet & Knits','கிரோஷே','crochet','Handmade amigurumi, bags and slow-made softies.'),
('c5','Artists & Prints','ஓவியம்','artists','Portraits, Tanjore-inspired work and city prints.'),
('c6','Boutiques','பூட்டிக்','boutiques','Kanchipuram, cotton drapes and small-batch labels.'),
('c7','Handmade & Decor','கைவினை','handmade-decor','Terracotta, brass, kolam art and festival decor.'),
('c8','Gifting & Hampers','பரிசு','gifting','Seer varisai trays, return gifts and curated hampers.')
ON CONFLICT (id) DO NOTHING;