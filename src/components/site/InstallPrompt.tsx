import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "nammaspot.install.dismissedAt";
/** Stay quiet for two weeks after a dismissal. */
const QUIET_MS = 14 * 24 * 60 * 60 * 1000;
/** Let people browse a little before asking. */
const DELAY_MS = 25_000;

/**
 * Gentle "Add to Home Screen" prompt. Only shows when the browser itself says
 * the app is installable, after a delay, and never again for two weeks once
 * dismissed.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissedAt < QUIET_MS) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      timer = setTimeout(() => setVisible(true), DELAY_MS);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const close = () => {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!visible || !deferred) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 md:inset-x-auto md:right-6 md:bottom-6 md:w-80">
      <div className="card-soft flex items-start gap-3 bg-background p-4 shadow-[var(--shadow-lift)]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Add NammaSpot to your home screen</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Open your saved shops and favourite makers in one tap.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="rounded-full"
              onClick={async () => {
                try {
                  await deferred.prompt();
                  await deferred.userChoice;
                } catch {
                  /* prompt already consumed */
                }
                close();
              }}
            >
              <Download className="size-4" /> Add
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={close}>
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Dismiss install prompt"
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-secondary"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
