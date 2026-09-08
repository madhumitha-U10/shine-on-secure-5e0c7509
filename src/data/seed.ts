/**
 * NammaSpot seed data.
 *
 * This mirrors the Google Sheets schema exactly (one array = one sheet/tab),
 * so the same shapes work when the backend switches to Apps Script / Firebase.
 */

export type SellerStatus = "pending" | "approved" | "rejected";

export interface Category {
  id: string;
  name: string;
  tamilName: string;
  slug: string;
  blurb: string;
}

export interface Seller {
  id: string;
  slug: string;
  businessName: string;
  ownerName: string;
  categoryId: string;
  tagline: string;
  about: string;
  area: string;
  city: string;
  instagram: string;
  whatsapp: string;
  email: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  featured: boolean;
  status: SellerStatus;
  createdAt: string;
  deliversAcrossCity: boolean;
  tags: string[];
  /** Optional profile photo (sheet `imageUrl` column or uploaded data URL). */
  imageUrl?: string | undefined;
  /** Optional wide cover photo (sheet `coverUrl` column). */
  coverUrl?: string | undefined;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  type: "product" | "service";
  price: number;
  unit: string;
  description: string;
  views: number;
  active: boolean;
  /** Optional catalogue photo (sheet `imageUrl` column or uploaded data URL). */
  imageUrl?: string | undefined;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  area: string;
  createdAt: string;
  /** Optional customer profile picture (sheet `imageUrl` or uploaded data URL). */
  avatarUrl?: string | undefined;
}

export interface Enquiry {
  id: string;
  sellerId: string;
  productId: string | null;
  customerName: string;
  phone: string;
  eventDate: string;
  message: string;
  status: "new" | "responded" | "closed";
  createdAt: string;
}

export interface Review {
  id: string;
  sellerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  approved: boolean;
}

export interface Story {
  id: string;
  sellerId: string;
  title: string;
  excerpt: string;
  body: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "c1",
    name: "Home Bakers",
    tamilName: "வீட்டு பேக்கிங்",
    slug: "home-bakers",
    blurb: "Custom cakes, brownies and teatime bakes from home kitchens.",
  },
  {
    id: "c2",
    name: "Mehendi Artists",
    tamilName: "மருதாணி",
    slug: "mehendi",
    blurb: "Bridal and festive henna, booked directly with the artist.",
  },
  {
    id: "c3",
    name: "Makeup & Bridal",
    tamilName: "மேக்கப்",
    slug: "makeup-bridal",
    blurb: "Muhurtham, reception and engagement styling.",
  },
  {
    id: "c4",
    name: "Crochet & Knits",
    tamilName: "கிரோஷே",
    slug: "crochet",
    blurb: "Handmade amigurumi, bags and slow-made softies.",
  },
  {
    id: "c5",
    name: "Artists & Prints",
    tamilName: "ஓவியம்",
    slug: "artists",
    blurb: "Portraits, Tanjore-inspired work and city prints.",
  },
  {
    id: "c6",
    name: "Boutiques",
    tamilName: "பூட்டிக்",
    slug: "boutiques",
    blurb: "Kanchipuram, cotton drapes and small-batch labels.",
  },
  {
    id: "c7",
    name: "Handmade & Decor",
    tamilName: "கைவினை",
    slug: "handmade-decor",
    blurb: "Terracotta, brass, kolam art and festival decor.",
  },
  {
    id: "c8",
    name: "Gifting & Hampers",
    tamilName: "பரிசு",
    slug: "gifting",
    blurb: "Seer varisai trays, return gifts and curated hampers.",
  },
];

export const SELLERS: Seller[] = [
  {
    id: "s1",
    slug: "amma-veedu-bakes",
    businessName: "Amma Veedu Bakes",
    ownerName: "Aishwarya R",
    categoryId: "c1",
    tagline: "Filter-coffee tres leches & Chennai teatime bakes",
    about:
      "A two-oven home kitchen in Mylapore baking eggless cakes, brownies and teatime treats with local flavours — filter coffee, jaggery, nendran banana. Orders taken 3 days in advance.",
    area: "Mylapore",
    city: "Chennai",
    instagram: "ammaveedubakes",
    whatsapp: "919840112233",
    email: "hello@ammaveedubakes.in",
    rating: 4.9,
    reviewCount: 132,
    priceFrom: 450,
    featured: true,
    status: "approved",
    createdAt: "2024-11-02",
    deliversAcrossCity: true,
    tags: ["Eggless", "Custom cakes", "Same-day brownies"],
  },
  {
    id: "s2",
    slug: "kolam-henna-studio",
    businessName: "Kolam Henna Studio",
    ownerName: "Divya Lakshmi",
    categoryId: "c2",
    tagline: "Bridal mehendi rooted in kolam motifs",
    about:
      "Bridal and festive henna in Adyar since 2016. Organic paste, kolam-inspired negative space work, and full bridal packages including the pattu-saree side of the family.",
    area: "Adyar",
    city: "Chennai",
    instagram: "kolamhennastudio",
    whatsapp: "919841556677",
    email: "book@kolamhenna.in",
    rating: 4.8,
    reviewCount: 96,
    priceFrom: 1500,
    featured: true,
    status: "approved",
    createdAt: "2024-09-18",
    deliversAcrossCity: true,
    tags: ["Organic paste", "Bridal", "Home visits"],
  },
  {
    id: "s3",
    slug: "muhurtham-by-shruthi",
    businessName: "Muhurtham by Shruthi",
    ownerName: "Shruthi Narayanan",
    categoryId: "c3",
    tagline: "HD bridal makeup for South Indian weddings",
    about:
      "Airbrush and HD bridal makeup specialising in muhurtham looks, kondai styling and jadai alangaram. Travels across Tamil Nadu for wedding weeks.",
    area: "Besant Nagar",
    city: "Chennai",
    instagram: "muhurthambyshruthi",
    whatsapp: "919003445566",
    email: "shruthi@muhurtham.in",
    rating: 4.9,
    reviewCount: 74,
    priceFrom: 12000,
    featured: true,
    status: "approved",
    createdAt: "2025-01-11",
    deliversAcrossCity: true,
    tags: ["HD & airbrush", "Jadai alangaram", "Outstation"],
  },
  {
    id: "s4",
    slug: "nool-crochet",
    businessName: "Nool Crochet Co",
    ownerName: "Meenakshi S",
    categoryId: "c4",
    tagline: "Slow-made crochet from a T Nagar balcony",
    about:
      "Handmade amigurumi, market totes and baby sets crocheted in soft cotton. Every piece takes days, not minutes — made to order in small batches.",
    area: "T Nagar",
    city: "Chennai",
    instagram: "noolcrochet",
    whatsapp: "919789223344",
    email: "nool@crochet.in",
    rating: 4.7,
    reviewCount: 58,
    priceFrom: 350,
    featured: false,
    status: "approved",
    createdAt: "2025-02-20",
    deliversAcrossCity: true,
    tags: ["Made to order", "Cotton yarn", "Ships all India"],
  },
  {
    id: "s5",
    slug: "chitra-varnam",
    businessName: "Chitra Varnam",
    ownerName: "Karthik Subramanian",
    categoryId: "c5",
    tagline: "Chennai in ink — prints, portraits, wedding invites",
    about:
      "Illustrator working out of Kodambakkam. Known for pen-and-ink studies of Chennai streets, Tanjore-inspired commissions and hand-drawn wedding stationery.",
    area: "Kodambakkam",
    city: "Chennai",
    instagram: "chitravarnam.art",
    whatsapp: "919600778899",
    email: "studio@chitravarnam.in",
    rating: 4.8,
    reviewCount: 41,
    priceFrom: 800,
    featured: true,
    status: "approved",
    createdAt: "2024-12-05",
    deliversAcrossCity: true,
    tags: ["Commissions", "Wedding invites", "Framed prints"],
  },
  {
    id: "s6",
    slug: "kanchi-thread-boutique",
    businessName: "Kanchi Thread Boutique",
    ownerName: "Revathi M",
    categoryId: "c6",
    tagline: "Handloom Kanchipuram, straight from the weaver",
    about:
      "A small boutique sourcing directly from weaver families in Kanchipuram and Arani. Pure zari sarees, cotton drapes and blouse tailoring in-house.",
    area: "Anna Nagar",
    city: "Chennai",
    instagram: "kanchithread",
    whatsapp: "919444990011",
    email: "care@kanchithread.in",
    rating: 4.6,
    reviewCount: 87,
    priceFrom: 2800,
    featured: false,
    status: "approved",
    createdAt: "2024-08-14",
    deliversAcrossCity: true,
    tags: ["Weaver direct", "Pure zari", "Blouse tailoring"],
  },
  {
    id: "s7",
    slug: "mann-terracotta",
    businessName: "Mann Terracotta",
    ownerName: "Prabhu Velan",
    categoryId: "c7",
    tagline: "Wheel-thrown pottery & festival decor",
    about:
      "Third-generation potters near Villivakkam making terracotta planters, water jugs, Karthigai deepam sets and kolam stencils.",
    area: "Villivakkam",
    city: "Chennai",
    instagram: "mannterracotta",
    whatsapp: "919345667788",
    email: "mann@terracotta.in",
    rating: 4.7,
    reviewCount: 63,
    priceFrom: 250,
    featured: false,
    status: "approved",
    createdAt: "2025-03-03",
    deliversAcrossCity: false,
    tags: ["Wheel-thrown", "Festival sets", "Bulk orders"],
  },
  {
    id: "s8",
    slug: "seer-varisai-studio",
    businessName: "Seer Varisai Studio",
    ownerName: "Bhavani K",
    categoryId: "c8",
    tagline: "Wedding trays, return gifts, thamboolam bags",
    about:
      "Curated seer varisai trays and return gifting for Tamil weddings and seemantham — assembled in Velachery with local artisan products.",
    area: "Velachery",
    city: "Chennai",
    instagram: "seervarisaistudio",
    whatsapp: "919098112255",
    email: "orders@seervarisai.in",
    rating: 4.8,
    reviewCount: 52,
    priceFrom: 600,
    featured: false,
    status: "approved",
    createdAt: "2025-04-12",
    deliversAcrossCity: true,
    tags: ["Wedding gifting", "Bulk", "Custom trays"],
  },
  {
    id: "s9",
    slug: "coimbatore-cocoa",
    businessName: "Coimbatore Cocoa Room",
    ownerName: "Anitha Devi",
    categoryId: "c1",
    tagline: "Single-origin bean-to-bar chocolate",
    about:
      "Bean-to-bar chocolate made with cocoa from Pollachi farms. Awaiting approval on NammaSpot.",
    area: "RS Puram",
    city: "Coimbatore",
    instagram: "coimbatorecocoa",
    whatsapp: "919812334455",
    email: "hi@cbecocoa.in",
    rating: 0,
    reviewCount: 0,
    priceFrom: 320,
    featured: false,
    status: "pending",
    createdAt: "2026-07-28",
    deliversAcrossCity: true,
    tags: ["Bean to bar", "Pollachi cocoa"],
  },
  {
    id: "s10",
    slug: "madurai-jasmine-decor",
    businessName: "Madurai Jasmine Decor",
    ownerName: "Sathya Priya",
    categoryId: "c7",
    tagline: "Malligai garlands & event flower work",
    about:
      "Fresh Madurai malligai garlands, poo jadai and mandapam flower work. New to the platform.",
    area: "Simmakkal",
    city: "Madurai",
    instagram: "maduraijasmindecor",
    whatsapp: "919677443322",
    email: "sathya@jasmindecor.in",
    rating: 0,
    reviewCount: 0,
    priceFrom: 900,
    featured: false,
    status: "pending",
    createdAt: "2026-08-05",
    deliversAcrossCity: false,
    tags: ["Fresh flowers", "Mandapam decor"],
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    sellerId: "s1",
    name: "Filter Coffee Tres Leches",
    type: "product",
    price: 1250,
    unit: "500g",
    description: "Soaked sponge with degree-coffee milk and a burnt jaggery top.",
    views: 342,
    active: true,
  },
  {
    id: "p2",
    sellerId: "s1",
    name: "Nendran Banana Loaf",
    type: "product",
    price: 480,
    unit: "loaf",
    description: "Kerala nendran banana, walnut, eggless.",
    views: 210,
    active: true,
  },
  {
    id: "p3",
    sellerId: "s1",
    name: "Fudgy Brownie Box (6)",
    type: "product",
    price: 450,
    unit: "box of 6",
    description: "Same-day dispatch across Chennai.",
    views: 508,
    active: true,
  },
  {
    id: "p4",
    sellerId: "s1",
    name: "Custom Birthday Cake",
    type: "service",
    price: 1800,
    unit: "1kg onwards",
    description: "Theme cakes, 3 days notice.",
    views: 297,
    active: true,
  },
  {
    id: "p5",
    sellerId: "s2",
    name: "Bridal Mehendi — Full Hands & Feet",
    type: "service",
    price: 9500,
    unit: "session",
    description: "5-6 hours, organic paste, includes bridal party touch-ups.",
    views: 402,
    active: true,
  },
  {
    id: "p6",
    sellerId: "s2",
    name: "Festive Simple Mehendi",
    type: "service",
    price: 1500,
    unit: "per person",
    description: "Front hand kolam-style design, 45 mins.",
    views: 265,
    active: true,
  },
  {
    id: "p7",
    sellerId: "s2",
    name: "Home Visit — Family Package (5)",
    type: "service",
    price: 6000,
    unit: "5 people",
    description: "Artist travels to your home within Chennai.",
    views: 158,
    active: true,
  },
  {
    id: "p8",
    sellerId: "s3",
    name: "Muhurtham Bridal Package",
    type: "service",
    price: 22000,
    unit: "day",
    description: "HD makeup, kondai styling, saree draping, jewellery setting.",
    views: 480,
    active: true,
  },
  {
    id: "p9",
    sellerId: "s3",
    name: "Reception Glam",
    type: "service",
    price: 15000,
    unit: "session",
    description: "Airbrush base, hairstyling, lashes.",
    views: 331,
    active: true,
  },
  {
    id: "p10",
    sellerId: "s3",
    name: "Guest / Sister of Bride",
    type: "service",
    price: 4500,
    unit: "person",
    description: "Party makeup and draping.",
    views: 190,
    active: true,
  },
  {
    id: "p11",
    sellerId: "s4",
    name: "Amigurumi Elephant",
    type: "product",
    price: 850,
    unit: "piece",
    description: "Cotton yarn, 20cm, safe for toddlers.",
    views: 221,
    active: true,
  },
  {
    id: "p12",
    sellerId: "s4",
    name: "Crochet Market Tote",
    type: "product",
    price: 1150,
    unit: "piece",
    description: "Sturdy jute-cotton blend, fits a week of vegetables.",
    views: 176,
    active: true,
  },
  {
    id: "p13",
    sellerId: "s4",
    name: "Baby Booties & Cap Set",
    type: "product",
    price: 650,
    unit: "set",
    description: "0-6 months, hypoallergenic yarn.",
    views: 143,
    active: true,
  },
  {
    id: "p14",
    sellerId: "s5",
    name: "Chennai Streets Print Set",
    type: "product",
    price: 1400,
    unit: "set of 3",
    description: "A4 giclée prints — Marina, Mylapore tank, Ratna Cafe.",
    views: 388,
    active: true,
  },
  {
    id: "p15",
    sellerId: "s5",
    name: "Hand-drawn Wedding Invite",
    type: "service",
    price: 6500,
    unit: "design",
    description: "Custom illustrated invite with print-ready files.",
    views: 204,
    active: true,
  },
  {
    id: "p16",
    sellerId: "s5",
    name: "Ink Portrait Commission",
    type: "service",
    price: 2500,
    unit: "A4",
    description: "Two-week turnaround, framed option available.",
    views: 167,
    active: true,
  },
  {
    id: "p17",
    sellerId: "s6",
    name: "Pure Zari Kanchipuram Saree",
    type: "product",
    price: 18500,
    unit: "saree",
    description: "Weaver-direct, korvai border, silk mark certified.",
    views: 512,
    active: true,
  },
  {
    id: "p18",
    sellerId: "s6",
    name: "Handloom Cotton Drape",
    type: "product",
    price: 2800,
    unit: "saree",
    description: "Arani cotton, everyday wear.",
    views: 246,
    active: true,
  },
  {
    id: "p19",
    sellerId: "s6",
    name: "Blouse Stitching",
    type: "service",
    price: 950,
    unit: "blouse",
    description: "In-house tailoring, 7 days.",
    views: 132,
    active: true,
  },
  {
    id: "p20",
    sellerId: "s7",
    name: "Terracotta Planter Trio",
    type: "product",
    price: 850,
    unit: "set of 3",
    description: "Wheel-thrown, unglazed, drainage holes.",
    views: 198,
    active: true,
  },
  {
    id: "p21",
    sellerId: "s7",
    name: "Karthigai Deepam Set (12)",
    type: "product",
    price: 250,
    unit: "set of 12",
    description: "Hand-pressed clay agal vilakku.",
    views: 421,
    active: true,
  },
  {
    id: "p22",
    sellerId: "s7",
    name: "Kolam Stencil Roller",
    type: "product",
    price: 320,
    unit: "piece",
    description: "Traditional pulli kolam patterns.",
    views: 288,
    active: true,
  },
  {
    id: "p23",
    sellerId: "s8",
    name: "Seer Varisai Tray Set (11)",
    type: "product",
    price: 8500,
    unit: "set",
    description: "Decorated trays with silk, fruit and thamboolam arrangement.",
    views: 306,
    active: true,
  },
  {
    id: "p24",
    sellerId: "s8",
    name: "Return Gift Bags (50)",
    type: "product",
    price: 4500,
    unit: "50 bags",
    description: "Handmade soap, kumkum box and jute bag.",
    views: 219,
    active: true,
  },
];

export const CUSTOMERS: Customer[] = [
  {
    id: "cu1",
    name: "Priya Vasanth",
    phone: "919840001122",
    area: "Adyar",
    createdAt: "2026-05-02",
  },
  {
    id: "cu2",
    name: "Hari Prasad",
    phone: "919840223344",
    area: "Velachery",
    createdAt: "2026-05-19",
  },
  {
    id: "cu3",
    name: "Nithya Raman",
    phone: "919000445566",
    area: "Anna Nagar",
    createdAt: "2026-06-01",
  },
  {
    id: "cu4",
    name: "Sundar Balaji",
    phone: "919111667788",
    area: "Tambaram",
    createdAt: "2026-06-22",
  },
  {
    id: "cu5",
    name: "Deepa Krishnan",
    phone: "919222889900",
    area: "Mylapore",
    createdAt: "2026-07-04",
  },
];

export const ENQUIRIES: Enquiry[] = [
  {
    id: "e1",
    sellerId: "s1",
    productId: "p4",
    customerName: "Priya Vasanth",
    phone: "919840001122",
    eventDate: "2026-08-24",
    message: "Need a 2kg filter coffee cake for appa's 60th. Can you do a kolam design on top?",
    status: "new",
    createdAt: "2026-08-10",
  },
  {
    id: "e2",
    sellerId: "s1",
    productId: "p3",
    customerName: "Hari Prasad",
    phone: "919840223344",
    eventDate: "2026-08-15",
    message: "2 brownie boxes to Velachery today evening possible?",
    status: "responded",
    createdAt: "2026-08-11",
  },
  {
    id: "e3",
    sellerId: "s2",
    productId: "p5",
    customerName: "Nithya Raman",
    phone: "919000445566",
    eventDate: "2026-11-09",
    message: "Muhurtham on 9 Nov, need bridal mehendi plus 4 family members.",
    status: "new",
    createdAt: "2026-08-09",
  },
  {
    id: "e4",
    sellerId: "s3",
    productId: "p8",
    customerName: "Deepa Krishnan",
    phone: "919222889900",
    eventDate: "2026-12-14",
    message: "Wedding at Kalyana Mandapam, Mylapore. Trial slot available in October?",
    status: "responded",
    createdAt: "2026-08-06",
  },
  {
    id: "e5",
    sellerId: "s6",
    productId: "p17",
    customerName: "Sundar Balaji",
    phone: "919111667788",
    eventDate: "2026-09-30",
    message: "Looking for a maroon korvai saree under 20k for wedding reception.",
    status: "closed",
    createdAt: "2026-07-30",
  },
];

export const REVIEWS: Review[] = [
  {
    id: "r1",
    sellerId: "s1",
    customerName: "Priya Vasanth",
    rating: 5,
    comment:
      "The filter coffee tres leches tasted exactly like Mylapore mornings. Delivered on time to Adyar.",
    createdAt: "2026-06-12",
    approved: true,
  },
  {
    id: "r2",
    sellerId: "s1",
    customerName: "Hari Prasad",
    rating: 5,
    comment: "Brownies reached fudgy and fresh. Ordered thrice already.",
    createdAt: "2026-07-02",
    approved: true,
  },
  {
    id: "r3",
    sellerId: "s2",
    customerName: "Nithya Raman",
    rating: 5,
    comment: "Divya's kolam-style bridal design was stunning and the stain darkened beautifully.",
    createdAt: "2026-05-28",
    approved: true,
  },
  {
    id: "r4",
    sellerId: "s3",
    customerName: "Deepa Krishnan",
    rating: 5,
    comment: "Shruthi handled a 5am muhurtham with total calm. Makeup held through the whole day.",
    createdAt: "2026-04-19",
    approved: true,
  },
  {
    id: "r5",
    sellerId: "s4",
    customerName: "Sundar Balaji",
    rating: 4,
    comment: "Lovely crochet elephant, took a week longer than promised.",
    createdAt: "2026-06-25",
    approved: true,
  },
  {
    id: "r6",
    sellerId: "s6",
    customerName: "Anonymous",
    rating: 2,
    comment: "Awaiting moderation — unverified complaint about delivery.",
    createdAt: "2026-08-11",
    approved: false,
  },
];

export const STORIES: Story[] = [
  {
    id: "st1",
    sellerId: "s1",
    title: "Two ovens, one Mylapore terrace",
    excerpt: "How Aishwarya turned a Sunday filter-coffee cake into 40 orders a week.",
    body: "Aishwarya started baking in 2021 with a borrowed OTG on her grandmother's terrace in Mylapore. The first cake she sold was a tres leches soaked in degree coffee from the shop at the end of the street. Today Amma Veedu Bakes takes about forty orders a week, all through Instagram DMs, and still bakes everything in the same kitchen.",
  },
  {
    id: "st2",
    sellerId: "s2",
    title: "Drawing kolam on skin",
    excerpt: "Divya's mehendi language comes from the pulli kolam her mother drew every morning.",
    body: "Divya Lakshmi grew up watching her mother draw pulli kolam at dawn in Adyar. When she began doing bridal mehendi, she found she was drawing the same grids and loops — negative space, symmetry, a dot to start. Brides now come specifically asking for the kolam bridal hand.",
  },
  {
    id: "st3",
    sellerId: "s7",
    title: "The last potters of Villivakkam",
    excerpt: "Three generations at the wheel, now selling Karthigai deepam sets across the city.",
    body: "Prabhu Velan's family has been throwing clay in Villivakkam for three generations. Land pressure took most of the neighbourhood kilns, but their Karthigai deepam sets still sell out every November — now to customers in Anna Nagar and Besant Nagar who found them online.",
  },
  {
    id: "st4",
    sellerId: "s5",
    title: "Chennai, in pen and ink",
    excerpt: "Karthik draws one street corner a week — Ratna Cafe queues included.",
    body: "Every Sunday Karthik Subramanian picks a corner of Chennai and draws it: the Mylapore tank, the Marina lighthouse, the queue outside Ratna Cafe. The prints started as a personal project and became the studio's most-shipped product.",
  },
];
