declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
  }
}

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "1016886836651819";

let pixelLoaded = false;
let pixelLoading = false;

function loadMetaPixel() {
  if (typeof window === "undefined") return;
  if (!META_PIXEL_ID) return;
  if (pixelLoaded || pixelLoading) return;

  pixelLoading = true;

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

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";

  script.onload = () => {
    pixelLoaded = true;
    pixelLoading = false;

    window.fbq?.("init", META_PIXEL_ID);
    window.fbq?.("track", "PageView");
  };

  script.onerror = () => {
    pixelLoading = false;
  };

  document.head.appendChild(script);
}

export function initMetaPixel() {
  if (typeof window === "undefined") return;

  const load = () => loadMetaPixel();

  if ("requestIdleCallback" in window && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(load, { timeout: 3000 });
  } else {
    window.setTimeout(load, 3000);
  }
}

function ensurePixelThenTrack(callback: () => void) {
  if (typeof window === "undefined") return;

  if (typeof window.fbq === "function") {
    callback();
    return;
  }

  loadMetaPixel();

  window.setTimeout(() => {
    if (typeof window.fbq === "function") {
      callback();
    }
  }, 1000);
}

export function trackCompleteRegistration(method: string = "website") {
  ensurePixelThenTrack(() => {
    window.fbq?.("track", "CompleteRegistration", {
      content_name: "Handyman Signup",
      status: "completed",
      registration_method: method,
    });
  });
}

export function trackLead(source: string = "website") {
  ensurePixelThenTrack(() => {
    window.fbq?.("track", "Lead", {
      content_name: "Handyman Interest",
      lead_source: source,
    });
  });
}