import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CalendarDays, Instagram, MapPin, MessageCircle, Phone, Share2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Rating } from "@/components/site/Rating";
import { PhotoPicker } from "@/components/site/PhotoPicker";
import { ProductImage } from "@/components/site/ProductImage";
import { SaveButton } from "@/components/site/SaveButton";
import { SellerAvatar } from "@/components/site/SellerAvatar";
import { ShareDialog } from "@/components/site/ShareDialog";
import { SiteShell } from "@/components/site/SiteShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SELLERS } from "@/data/seed";
import { useStoreData } from "@/hooks/use-store-data";
import {
  allCustomers,
  categoryById,
  createEnquiry,
  inr,
  productsBySeller,
  reviewsBySeller,
  sellerBySlug,
  setCustomerAvatar,
  storiesBySeller,
} from "@/lib/api";
import { trackStoreView, trackWhatsAppClick } from "@/lib/engagement";
import { imageForCategorySlug } from "@/lib/images";
import { productUrl, storeUrl, whatsAppChatUrl } from "@/lib/share";

export const Route = createFileRoute("/seller/$slug")({
  loader: ({ params }) => {
    const seller = SELLERS.find((s) => s.slug === params.slug);
    // Sellers registered in this browser resolve client-side instead.
    return { seedSeller: seller ?? null };
  },
  head: ({ params }) => {
    const seller = SELLERS.find((s) => s.slug === params.slug);
    const title = seller
      ? `${seller.businessName} — ${seller.area}, Chennai | NammaSpot`
      : "Seller — NammaSpot";
    const description = seller
      ? `${seller.tagline}. View the catalogue, reviews and send an enquiry to ${seller.businessName} in ${seller.area}.`
      : "Seller profile on NammaSpot.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">Seller not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This profile may have been removed or is awaiting approval.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/explore">Back to explore</Link>
        </Button>
      </div>
    </SiteShell>
  ),
  component: SellerProfile,
});

const enquirySchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{10,15}$/, "Enter a valid phone number"),
  eventDate: z.string().max(20),
  message: z.string().trim().min(10, "Tell the seller a bit more").max(1000),
});

function SellerProfile() {
  const { slug } = Route.useParams();
  const { seedSeller } = Route.useLoaderData();
  const { data: resolved } = useStoreData(() => ({ seller: sellerBySlug(slug) ?? null }));
  const seller = resolved ? resolved.seller : seedSeller;
  const { data: products } = useStoreData(() => {
    const s = sellerBySlug(slug);
    return s ? productsBySeller(s.id) : [];
  });
  const { data: reviews } = useStoreData(() => {
    const s = sellerBySlug(slug);
    return s ? reviewsBySeller(s.id) : [];
  });

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const sellerId = seller?.id;
  useEffect(() => {
    if (sellerId) trackStoreView(sellerId);
  }, [sellerId]);

  if (resolved && resolved.seller === null) throw notFound();
  if (!seller) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-6xl px-4 py-24 text-sm text-muted-foreground">
          Loading profile…
        </div>
      </SiteShell>
    );
  }

  const category = categoryById(seller.categoryId);
  const story = storiesBySeller(seller.id)[0];
  const shopUrl = storeUrl(seller.slug);

  return (
    <SiteShell>
      <div className="relative border-b border-border bg-card">
        <img
          src={imageForCategorySlug(category?.slug)}
          alt={seller.businessName}
          className="h-40 w-full object-cover sm:h-56"
        />
        <div className="mx-auto max-w-6xl px-4 pb-6 lg:px-6">
          <div className="-mt-16 grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-4">
            <SellerAvatar name={seller.businessName} src={seller.imageUrl} size="xl" />
            <div className="min-w-0">
              <Badge className="mb-2">{category?.name}</Badge>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{seller.businessName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{seller.tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <Rating value={seller.rating} count={seller.reviewCount} />
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {seller.area}, {seller.city}
                </span>
                <a
                  href={`https://instagram.com/${seller.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  <Instagram className="size-3.5" /> @{seller.instagram}
                </a>
                {seller.deliversAcrossCity && (
                  <span className="inline-flex items-center gap-1">
                    <Truck className="size-3.5" /> Delivers city-wide
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SaveButton kind="shop" id={seller.id} />
              <ShareDialog
                title={seller.businessName}
                url={shopUrl}
                shareText={`${seller.businessName} — ${seller.tagline} on NammaSpot`}
                sellerId={seller.id}
                instagram={seller.instagram}
                fileName={`nammaspot-${seller.slug}`}
                trigger={
                  <Button variant="outline" size="icon" aria-label="Share shop">
                    <Share2 className="size-4" />
                  </Button>
                }
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="rounded-full">
              <a href={`https://wa.me/${seller.whatsapp}`} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href={`tel:+${seller.whatsapp}`}>
                <Phone className="size-4" /> Call
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href="#enquiry">
                <CalendarDays className="size-4" /> Send enquiry
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        <Tabs defaultValue="catalogue">
          <TabsList>
            <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="catalogue" className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(products ?? []).map((p) => (
                <div key={p.id} className="card-soft flex flex-col p-4">
                  {p.imageUrl && (
                    <ProductImage
                      src={p.imageUrl}
                      alt={p.name}
                      className="mb-3 -mx-4 -mt-4 rounded-t-[inherit]"
                    />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 text-sm font-bold">{p.name}</h3>
                    <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                      {p.type}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-primary">
                      {inr(p.price)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">/ {p.unit}</span>
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setSelectedProduct(p.id);
                        document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Enquire
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <Button
                      asChild
                      size="sm"
                      className="rounded-full"
                      onClick={() => trackWhatsAppClick({ sellerId: seller.id, productId: p.id })}
                    >
                      <a
                        href={whatsAppChatUrl(
                          seller.whatsapp,
                          `Hi ${seller.businessName}, I'm interested in "${p.name}" (${inr(p.price)}) on NammaSpot.`,
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="size-4" /> Ask on WhatsApp
                      </a>
                    </Button>
                    <SaveButton kind="product" id={p.id} sellerId={seller.id} size="sm" />
                    <ShareDialog
                      title={p.name}
                      url={productUrl(p.id)}
                      shareText={`${p.name} from ${seller.businessName} on NammaSpot`}
                      productId={p.id}
                      sellerId={seller.id}
                      instagram={seller.instagram}
                      fileName={`nammaspot-${p.id}`}
                      trigger={
                        <Button variant="outline" size="icon" aria-label={`Share ${p.name}`}>
                          <Share2 className="size-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-6 max-w-2xl">
            <p className="text-sm leading-relaxed text-muted-foreground">{seller.about}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {seller.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="card-soft p-4">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">Owner</dt>
                <dd className="mt-1 text-sm font-semibold">{seller.ownerName}</dd>
              </div>
              <div className="card-soft p-4">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  Starts from
                </dt>
                <dd className="mt-1 text-sm font-semibold">{inr(seller.priceFrom)}</dd>
              </div>
              <div className="card-soft p-4">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">Email</dt>
                <dd className="mt-1 break-all text-sm font-semibold">{seller.email}</dd>
              </div>
              <div className="card-soft p-4">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  On NammaSpot since
                </dt>
                <dd className="mt-1 text-sm font-semibold">{seller.createdAt}</dd>
              </div>
            </dl>
            {story && (
              <div className="card-soft mt-6 p-5">
                <h3 className="text-base font-bold">{story.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{story.body}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 max-w-2xl space-y-3">
            {(reviews ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No reviews published yet.</p>
            )}
            {(reviews ?? []).map((r) => (
              <div key={r.id} className="card-soft p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{r.customerName}</p>
                  <Rating value={r.rating} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                <p className="mt-2 text-xs text-muted-foreground">{r.createdAt}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <EnquiryForm
          sellerId={seller.id}
          productId={selectedProduct}
          productName={(products ?? []).find((p) => p.id === selectedProduct)?.name}
        />
      </div>
    </SiteShell>
  );
}

function EnquiryForm({
  sellerId,
  productId,
  productName,
}: {
  sellerId: string;
  productId: string | null;
  productName?: string | undefined;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [avatar, setAvatar] = useState<string>("");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = enquirySchema.safeParse({
      customerName: String(fd.get("customerName") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      eventDate: String(fd.get("eventDate") ?? ""),
      message: String(fd.get("message") ?? ""),
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }

    setErrors({});
    createEnquiry({ ...parsed.data, sellerId, productId });
    if (avatar) {
      const customer = allCustomers().find((c) => c.phone === parsed.data.phone);
      if (customer) setCustomerAvatar(customer.id, avatar);
    }
    setSent(true);
    toast.success("Enquiry sent — the seller will reply on WhatsApp.");
    e.currentTarget.reset();
  };

  return (
    <section id="enquiry" className="mt-12 max-w-2xl scroll-mt-24">
      <h2 className="text-xl font-extrabold">Send an enquiry / booking request</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {productName ? `About: ${productName}` : "The seller replies directly on WhatsApp."}
      </p>

      <form onSubmit={submit} className="card-soft mt-4 space-y-4 p-5" noValidate>
        <div className="flex items-center gap-3">
          <PhotoPicker
            src={avatar || undefined}
            alt="your profile"
            label="profile picture"
            className="size-14 rounded-full"
            onPicked={setAvatar}
          />
          <p className="text-xs text-muted-foreground">Profile picture (optional)</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="customerName">Your name</Label>
            <Input id="customerName" name="customerName" maxLength={80} className="mt-1.5" />
            {errors["customerName"] && (
              <p className="mt-1 text-xs text-destructive">{errors["customerName"]}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">WhatsApp number</Label>
            <Input id="phone" name="phone" inputMode="tel" maxLength={15} className="mt-1.5" />
            {errors["phone"] && <p className="mt-1 text-xs text-destructive">{errors["phone"]}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="eventDate">Event / delivery date</Label>
          <Input id="eventDate" name="eventDate" type="date" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="message">What do you need?</Label>
          <Textarea id="message" name="message" rows={4} maxLength={1000} className="mt-1.5" />
          {errors["message"] && (
            <p className="mt-1 text-xs text-destructive">{errors["message"]}</p>
          )}
        </div>
        <Button type="submit" className="w-full rounded-full sm:w-auto">
          Send enquiry
        </Button>
        {sent && (
          <p className="text-xs text-primary">
            Sent. It now appears in the seller's dashboard under Enquiries.
          </p>
        )}
      </form>
    </section>
  );
}
