import { Button } from "@/components/ui/button";
import { Download, PlusSquare, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_KEY = "saskhandy-a2hs-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileDevice() {
  return (
    window.matchMedia("(max-width: 767px)").matches &&
    (navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches)
  );
}

function isIosDevice() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function AddToHomeScreen() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (
      !isMobileDevice() ||
      isStandalone() ||
      localStorage.getItem(DISMISSED_KEY)
    ) {
      return;
    }

    const ios = isIosDevice();
    setIsIos(ios);
    setVisible(true);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  };

  const install = async () => {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (outcome === "accepted") {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Install SaskHandy"
      className="fixed inset-x-3 z-[70] mx-auto max-w-sm rounded-2xl border border-primary/20 bg-white p-4 shadow-2xl md:hidden"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install suggestion"
        className="absolute right-2 top-2 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-3 pr-7">
        <img
          src="/images/favicon.png"
          alt=""
          className="h-12 w-12 shrink-0 rounded-xl border border-border object-cover"
        />
        <div>
          <p className="font-semibold text-foreground">
            Add SaskHandy to your Home Screen
          </p>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">
            Open jobs and messages faster, right from your phone.
          </p>
        </div>
      </div>

      {showInstructions ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted/70 px-3 py-2.5 text-sm text-foreground">
          {isIos ? (
            <Share className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          ) : (
            <PlusSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          )}
          <p>
            {isIos ? (
              <>
                Tap <strong>Share</strong>, then choose{" "}
                <strong>Add to Home Screen</strong>.
              </>
            ) : (
              <>
                Open your browser menu, then choose{" "}
                <strong>Add to Home screen</strong> or{" "}
                <strong>Install app</strong>.
              </>
            )}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={install} className="flex-1">
          {installPrompt ? <Download /> : isIos ? <Share /> : <PlusSquare />}
          {installPrompt ? "Install SaskHandy" : "Show me how"}
        </Button>
        <Button type="button" variant="ghost" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </aside>
  );
}
