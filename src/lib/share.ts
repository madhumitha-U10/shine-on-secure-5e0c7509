/**
 * Share helpers: shareable public URLs, WhatsApp/Instagram sharing, clipboard
 * copy and QR code generation. Browser-only (called from event handlers).
 */

import qrcode from "qrcode-generator";

export function siteOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

/** Public, shareable URL of a seller store. */
export const storeUrl = (slug: string) => `${siteOrigin()}/seller/${slug}`;

/** Public, shareable URL of a single product. */
export const productUrl = (productId: string) => `${siteOrigin()}/product/${productId}`;

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

export function whatsAppShareUrl(text: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}

/** Direct WhatsApp chat with a seller, with a pre-filled message. */
export function whatsAppChatUrl(phone: string, message: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const instagramProfileUrl = (handle: string) =>
  `https://instagram.com/${handle.replace(/^@/, "")}`;

/** Native share sheet when available. Returns false when unsupported/cancelled. */
export async function nativeShare(data: { title: string; text?: string; url: string }) {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}

/** QR code for any URL as a PNG-ish data URL (GIF), safe to render or download. */
export function qrDataUrl(value: string, cellSize = 6, margin = 4): string {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  return qr.createDataURL(cellSize, margin);
}

/** Trigger a download of the QR code image. */
export function downloadQr(value: string, filename: string) {
  const a = document.createElement("a");
  a.href = qrDataUrl(value, 10, 4);
  a.download = filename.endsWith(".gif") ? filename : `${filename}.gif`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
