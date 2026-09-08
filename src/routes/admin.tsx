import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SellerAvatar } from "@/components/site/SellerAvatar";
import { PageHeading, SiteShell } from "@/components/site/SiteShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SellerRowSkeleton } from "@/components/ui/SellerCardSkeleton";
import { useStoreData } from "@/hooks/use-store-data";
import {
  allEnquiries,
  allProducts,
  allReviews,
  allSellers,
  categories,
  categoryById,
  inr,
  sellerById,
  setReviewApproval,
  setSellerStatus,
} from "@/lib/api";
import { checkAdminSession, verifyAdminPassword } from "@/lib/admin-auth";
import { clearAdminToken, getAdminToken, setAdminToken } from "@/lib/session";

const TABS = [
  { id: "approval", label: "Seller Approval" },
  { id: "sellers", label: "Sellers" },
  { id: "catalogue", label: "Products / Services" },
  { id: "categories", label: "Categories" },
  { id: "enquiries", label: "Enquiries" },
  { id: "reviews", label: "Reviews" },
] as const;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — NammaSpot" },
      {
        name: "description",
        content:
          "NammaSpot admin console: approve sellers, moderate reviews and monitor enquiries across the Chennai marketplace.",
      },
      { property: "og:title", content: "Admin Console — NammaSpot" },
      { property: "og:description", content: "Moderation and approvals for NammaSpot." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [authState, setAuthState] = useState<"checking" | "out" | "in">("checking");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("approval");
  const [tick, setTick] = useState(0);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setAuthState("out");
      return;
    }
    void checkAdminSession({ data: { token } }).then((res) => {
      setAuthState(res.ok ? "in" : "out");
      if (!res.ok) clearAdminToken();
    });
  }, []);

  const { data: sellers, refresh: refreshSellers } = useStoreData(allSellers);
  const { data: reviews, refresh: refreshReviews } = useStoreData(allReviews);
  const { data: enquiries } = useStoreData(allEnquiries);
  const { data: products } = useStoreData(allProducts);

  if (authState === "checking") {
    return (
      <SiteShell>
        <div className="mx-auto max-w-6xl px-4 py-24 text-sm text-muted-foreground">Loading…</div>
      </SiteShell>
    );
  }

  if (authState === "out") {
    return (
      <SiteShell>
        <PageHeading
          eyebrow="Admin"
          title="Admin login"
          subtitle="Restricted to the NammaSpot team."
        />
        <div className="mx-auto max-w-sm px-4 py-8 lg:px-6">
          <form
            className="card-soft space-y-4 p-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const code = String(new FormData(e.currentTarget).get("code") ?? "");
              setLoginBusy(true);
              try {
                const res = await verifyAdminPassword({ data: { password: code } });
                if (res.ok && res.token) {
                  setAdminToken(res.token);
                  setAuthState("in");
                } else {
                  toast.error(res.error ?? "Invalid access code.");
                }
              } catch (err) {
                console.error("[admin-login]", err);
                toast.error("Could not verify access code. Please try again.");
              } finally {
                setLoginBusy(false);
              }
            }}
          >
            <div>
              <Label htmlFor="code">Access code</Label>
              <Input id="code" name="code" type="password" className="mt-1.5" />
            </div>
            <Button type="submit" disabled={loginBusy} className="w-full rounded-full">
              {loginBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {loginBusy ? "Verifying…" : "Enter console"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Admin access is restricted to the NammaSpot team.
            </p>
          </form>
        </div>
      </SiteShell>
    );
  }

  const sellersLoading = sellers === null;
  const all = sellers ?? [];
  const pending = all.filter((s) => s.status === "pending");

  const adminToken = getAdminToken();

  const decide = async (id: string, status: "approved" | "rejected") => {
    setDecidingId(id);
    try {
      await setSellerStatus(id, status, adminToken ?? undefined);
      refreshSellers();
      setTick(tick + 1);
      toast.success(status === "approved" ? "Seller approved and live" : "Seller rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this seller");
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <SiteShell>
      <PageHeading
        eyebrow="Admin"
        title="Moderation console"
        subtitle="Approve new sellers, moderate reviews and keep an eye on enquiries."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        <nav className="flex gap-1 overflow-x-auto pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              {t.label}
              {t.id === "approval" && pending.length > 0 && ` (${pending.length})`}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === "approval" && (
            <div className="space-y-3">
              {sellersLoading &&
                [...Array(3)].map((_, i) => (
                  <div key={`pending-skeleton-${i}`} className="card-soft">
                    <SellerRowSkeleton />
                  </div>
                ))}
              {!sellersLoading && pending.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing waiting for approval.</p>
              )}
              {pending.map((s) => (
                <div key={s.id} className="card-soft p-4">
                  <div className="flex items-start gap-3">
                    <SellerAvatar name={s.businessName} src={s.imageUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{s.businessName}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.ownerName} · {categoryById(s.categoryId)?.name} · {s.area}, {s.city}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.about}</p>
                      <p className="mt-2 truncate text-xs text-muted-foreground">
                        @{s.instagram} · {s.email} · applied {s.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={decidingId === s.id}
                      onClick={() => decide(s.id, "approved")}
                    >
                      {decidingId === s.id ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Check className="size-4" />
                      )}
                      {decidingId === s.id ? "Working…" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={decidingId === s.id}
                      onClick={() => decide(s.id, "rejected")}
                    >
                      <X className="size-4" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "sellers" && (
            <div className="card-soft divide-y divide-border">
              {sellersLoading &&
                [...Array(5)].map((_, i) => <SellerRowSkeleton key={`seller-skeleton-${i}`} />)}
              {all.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4"
                >
                  <SellerAvatar name={s.businessName} src={s.imageUrl} size="sm" />
                  <div className="min-w-0">
                    <Link
                      to="/seller/$slug"
                      params={{ slug: s.slug }}
                      className="truncate text-sm font-semibold hover:text-primary"
                    >
                      {s.businessName}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {categoryById(s.categoryId)?.name} · {s.area} · {s.reviewCount} reviews
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={s.status === "approved" ? "default" : "secondary"}>
                      {s.status}
                    </Badge>
                    {s.status !== "approved" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={decidingId === s.id}
                        onClick={() => decide(s.id, "approved")}
                      >
                        {decidingId === s.id ? "Working…" : "Approve"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        disabled={decidingId === s.id}
                        onClick={() => decide(s.id, "rejected")}
                      >
                        {decidingId === s.id ? "Working…" : "Suspend"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "catalogue" && (
            <div className="card-soft divide-y divide-border">
              {(products ?? []).map((p) => (
                <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {sellerById(p.sellerId)?.businessName} · {p.type}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-primary">{inr(p.price)}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "categories" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories().map((c) => (
                <div key={c.id} className="card-soft p-4">
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-xs text-primary/80">{c.tamilName}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{c.blurb}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {all.filter((s) => s.categoryId === c.id).length} sellers · slug{" "}
                    <code>{c.slug}</code>
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "enquiries" && (
            <div className="card-soft divide-y divide-border">
              {(enquiries ?? []).map((e) => (
                <div key={e.id} className="p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {e.customerName} → {sellerById(e.sellerId)?.businessName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.phone} · event {e.eventDate || "—"} · {e.createdAt}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {e.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{e.message}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "reviews" && (
            <div className="space-y-3">
              {(reviews ?? []).map((r) => (
                <div key={r.id} className="card-soft p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {r.customerName} · {r.rating}★
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sellerById(r.sellerId)?.businessName} · {r.createdAt}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={r.approved ? "ghost" : "default"}
                      className="shrink-0 rounded-full"
                      onClick={async () => {
                        try {
                          await setReviewApproval(r.id, !r.approved, adminToken ?? undefined);
                          refreshReviews();
                          toast.success(r.approved ? "Review hidden" : "Review published");
                        } catch (error) {
                          toast.error(
                            error instanceof Error ? error.message : "Could not update review",
                          );
                        }
                      }}
                    >
                      {r.approved ? "Hide" : "Publish"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="mt-8 rounded-full"
          onClick={() => {
            clearAdminToken();
            setAuthState("out");
          }}
        >
          Sign out of admin
        </Button>
      </div>
    </SiteShell>
  );
}
