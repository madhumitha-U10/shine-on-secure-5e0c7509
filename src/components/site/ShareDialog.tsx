import { Check, Copy, Download, Instagram, Link2, MessageCircle, QrCode } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trackShare } from "@/lib/engagement";
import {
  copyToClipboard,
  downloadQr,
  instagramProfileUrl,
  nativeShare,
  qrDataUrl,
  whatsAppShareUrl,
} from "@/lib/share";

export function ShareDialog({
  trigger,
  title,
  url,
  shareText,
  instagram,
  sellerId,
  productId,
  fileName = "nammaspot-qr",
}: {
  trigger: ReactNode;
  title: string;
  url: string;
  shareText: string;
  instagram?: string | undefined;
  sellerId?: string | undefined;
  productId?: string | undefined;
  fileName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const qr = useMemo(() => (open && showQr && url ? qrDataUrl(url) : ""), [open, showQr, url]);

  const counted = () =>
    trackShare({ ...(sellerId ? { sellerId } : {}), ...(productId ? { productId } : {}) });

  const copy = async () => {
    const ok = await copyToClipboard(url);
    if (!ok) {
      toast.error("Could not copy the link — long-press to copy it manually.");
      return;
    }
    counted();
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setShowQr(false);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share {title}</DialogTitle>
          <DialogDescription>Send this link anywhere — no app or login needed.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-2">
          <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {url || "Preparing link…"}
          </span>
          <Button size="sm" variant="secondary" className="shrink-0 rounded-full" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            asChild
            className="rounded-full"
            onClick={() => {
              counted();
            }}
          >
            <a href={whatsAppShareUrl(shareText, url)} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </Button>

          <Button
            variant="outline"
            className="rounded-full"
            onClick={async () => {
              const shared = await nativeShare({ title, text: shareText, url });
              if (shared) {
                counted();
                return;
              }
              const ok = await copyToClipboard(`${shareText} ${url}`);
              if (ok) {
                counted();
                toast.success("Caption copied — paste it in your Instagram story or bio.");
              } else {
                toast.error("Could not copy the caption.");
              }
              if (instagram) window.open(instagramProfileUrl(instagram), "_blank", "noopener");
            }}
          >
            <Instagram className="size-4" /> Instagram
          </Button>
        </div>

        <div className="rounded-lg border border-border p-3">
          {!showQr ? (
            <Button
              variant="ghost"
              className="w-full rounded-full"
              onClick={() => setShowQr(true)}
              disabled={!url}
            >
              <QrCode className="size-4" /> Show QR code
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {qr ? (
                <img
                  src={qr}
                  alt={`QR code linking to ${title}`}
                  className="size-40 rounded-md bg-white p-1 [image-rendering:pixelated]"
                />
              ) : (
                <div className="size-40 animate-pulse rounded-md bg-muted" />
              )}
              <p className="text-center text-xs text-muted-foreground">
                Print it, or add it to your packaging and shop board.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  downloadQr(url, fileName);
                  counted();
                  toast.success("QR code downloaded");
                }}
              >
                <Download className="size-4" /> Download QR
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
