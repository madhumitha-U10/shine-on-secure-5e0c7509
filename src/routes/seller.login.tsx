import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeading, SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { restoreSellerProfile, type Seller } from "@/lib/api";
import { setSession } from "@/lib/session";
import { signInSeller } from "@/lib/seller-auth";

export const Route = createFileRoute("/seller/login")({
  head: () => ({
    meta: [
      { title: "Seller Login — NammaSpot" },
      {
        name: "description",
        content:
          "Sign in to your NammaSpot seller dashboard with your NammaSpot ID and password to manage your catalogue, enquiries, customers and analytics.",
      },
      { property: "og:title", content: "Seller Login — NammaSpot" },
      { property: "og:description", content: "Access your NammaSpot seller dashboard." },
    ],
  }),
  component: SellerLogin,
});

function SellerLogin() {
  const navigate = useNavigate();
  const [nammaspotId, setNammaspotId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!nammaspotId.trim()) next["nammaspotId"] = "Enter your NammaSpot ID";
    if (!password) next["password"] = "Enter your password";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const result = await signInSeller({ nammaspotId, password });
    setBusy(false);

    if (!result.ok) {
      setErrors({ form: result.error ?? "Incorrect NammaSpot ID or password." });
      toast.error(result.error ?? "Incorrect NammaSpot ID or password.");
      return;
    }
    if (!result.sellerId) {
      setErrors({
        form: "No seller profile is linked to this ID yet. Please register your business.",
      });
      return;
    }

    if (result.profile) restoreSellerProfile(result.profile as Seller);
    setSession(result.sellerId);
    toast.success("Vanakkam! Welcome back.");
    navigate({ to: "/seller/dashboard" });
  };

  const err = (k: string) =>
    errors[k] ? <p className="mt-1 text-xs text-destructive">{errors[k]}</p> : null;

  return (
    <SiteShell>
      <PageHeading eyebrow="Sellers" title="Seller login" subtitle="Manage your Chennai brand." />
      <div className="mx-auto w-full max-w-md px-4 py-8 lg:px-6">
        <form onSubmit={submit} className="card-soft space-y-4 p-5" noValidate>
          <div>
            <Label htmlFor="nammaspotId">NammaSpot ID</Label>
            <Input
              id="nammaspotId"
              name="nammaspotId"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={nammaspotId}
              onChange={(e) => setNammaspotId(e.target.value)}
              placeholder="ammaveedubakes"
              className="mt-1.5"
              maxLength={24}
            />
            {err("nammaspotId")}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
            />
            {err("password")}
          </div>
          {errors["form"] ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {errors["form"]}
            </p>
          ) : null}
          <Button type="submit" disabled={busy} className="w-full rounded-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link to="/seller/register" className="text-primary hover:underline">
              List your business
            </Link>
          </p>
        </form>
      </div>
    </SiteShell>
  );
}
