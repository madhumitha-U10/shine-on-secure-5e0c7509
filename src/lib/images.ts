import bakes from "@/assets/hero-bakes.jpg";
import crafts from "@/assets/hero-crafts.jpg";
import mehendi from "@/assets/hero-mehendi.jpg";
import catBakery from "@/assets/cat-bakery.jpg";
import catCrochet from "@/assets/cat-crochet.jpg";
import catBridal from "@/assets/cat-bridal.jpg";
import catArtists from "@/assets/cat-artists.jpg";
import catBoutiques from "@/assets/cat-boutiques.jpg";
import catDecor from "@/assets/cat-decor.jpg";
import catGifting from "@/assets/cat-gifting.jpg";

export const heroImages = { mehendi, bakes, crafts };

/** Category slug -> representative image. Swap for Drive URLs in production. */
export const categoryImage: Record<string, string> = {
  "home-bakers": catBakery,
  mehendi: mehendi,
  "makeup-bridal": catBridal,
  crochet: catCrochet,
  artists: catArtists,
  boutiques: catBoutiques,
  "handmade-decor": catDecor,
  gifting: catGifting,
};

/**
 * Keyword fallback so categories created in the sheet (e.g. "bakery",
 * "bridal", "art") still get a relevant image instead of the generic one.
 */
const keywordImage: [RegExp, string][] = [
  [/bak|cake|dessert|choco/, catBakery],
  [/crochet|knit|yarn|amigurumi/, catCrochet],
  [/bridal|makeup|wedding|muhurtham/, catBridal],
  [/mehendi|henna|maruthani/, mehendi],
  [/art|paint|print|portrait/, catArtists],
  [/boutique|saree|cloth|fashion|textile/, catBoutiques],
  [/decor|handmade|terracotta|craft|pottery/, catDecor],
  [/gift|hamper|return/, catGifting],
];

export function imageForCategorySlug(slug?: string) {
  if (!slug) return crafts;
  const direct = categoryImage[slug];
  if (direct) return direct;
  const key = slug.toLowerCase();
  for (const [re, img] of keywordImage) if (re.test(key)) return img;
  return crafts;
}
