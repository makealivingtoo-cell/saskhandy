import { hasMetaConsent, META_CONSENT_CHANGED } from "./metaConsent";
import { jobLeadData, registrationData } from "@shared/metaConversions";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

type RegistrationUserType = "homeowner" | "handyman";

const META_PIXEL_ID =
  import.meta.env.VITE_META_PIXEL_ID || "1016886836651819";

let pixelLoaded = false;
let pixelLoading = false;
let pixelInitialized = false;

function initializePixel() {
  if (typeof window === "undefined" || !hasMetaConsent()) return;
  if (!META_PIXEL_ID) return;
  if (typeof window.fbq !== "function") return;
  if (pixelInitialized) return;

  /*
   * Queue initialization immediately.
   *
   * This mirrors Meta's normal Pixel behavior: init is placed in the fbq
   * queue before any conversion event, even if fbevents.js is still loading.
   */
  window.fbq("set", "autoConfig", false, META_PIXEL_ID);
  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");

  pixelInitialized = true;
}

function loadMetaPixel() {
  if (typeof window === "undefined" || !hasMetaConsent()) return;
  if (!META_PIXEL_ID) return;

  if (!window.fbq) {
    const fbq = function (...args: any[]) {
      if ((fbq as any).callMethod) {
        (fbq as any).callMethod(...args);
      } else {
        (fbq as any).queue.push(args);
      }
    };

    (fbq as any).push = fbq;
    (fbq as any).loaded = true;
    (fbq as any).version = "2.0";
    (fbq as any).queue = [];

    window.fbq = fbq;
    window._fbq = fbq;
  }

  // Make sure init is queued BEFORE any registration/lead event.
  initializePixel();

  if (pixelLoaded || pixelLoading) return;

  pixelLoading = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";

  script.onload = () => {
    pixelLoaded = true;
    pixelLoading = false;
  };

  script.onerror = () => {
    pixelLoading = false;
  };

  document.head.appendChild(script);
}

export function initMetaPixel() {
  if (typeof window === "undefined") return;
  window.addEventListener(META_CONSENT_CHANGED, () => {
    if (hasMetaConsent()) {
      window.fbq?.("consent", "grant");
      loadMetaPixel();
    } else {
      window.fbq?.("consent", "revoke");
    }
  });

  const load = () => loadMetaPixel();

  if (
    "requestIdleCallback" in window &&
    typeof window.requestIdleCallback === "function"
  ) {
    window.requestIdleCallback(load, { timeout: 3000 });
  } else {
    window.setTimeout(load, 3000);
  }
}

function ensurePixelThenTrack(callback: () => void) {
  if (typeof window === "undefined" || !hasMetaConsent()) return;

  /*
   * loadMetaPixel creates the fbq queue and queues Pixel initialization
   * synchronously, so conversion events can safely be queued immediately
   * afterward even if the Meta script has not finished downloading yet.
   */
  if (!pixelInitialized || typeof window.fbq !== "function") {
    loadMetaPixel();
  }

  if (typeof window.fbq === "function") {
    callback();
  }
}

export function trackCompleteRegistration(
  method: string = "website",
  userType?: RegistrationUserType,
  eventId?: string
) {
  if (!eventId || !userType) return;
  ensurePixelThenTrack(() => {
    window.fbq?.("track", "CompleteRegistration", {
      ...registrationData(userType), registration_method: method,
    }, { eventID: eventId });
  });
}

export function trackJobLead(eventId?: string) {
  if (!eventId) return;
  ensurePixelThenTrack(() => {
    window.fbq?.("track", "Lead", jobLeadData, { eventID: eventId });
  });
}
