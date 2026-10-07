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
  if (typeof window === "undefined") return;
  if (!META_PIXEL_ID) return;
  if (typeof window.fbq !== "function") return;
  if (pixelInitialized) return;

  /*
   * Queue initialization immediately.
   *
   * This mirrors Meta's normal Pixel behavior: init is placed in the fbq
   * queue before any conversion event, even if fbevents.js is still loading.
   */
  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");

  pixelInitialized = true;
}

function loadMetaPixel() {
  if (typeof window === "undefined") return;
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
  if (typeof window === "undefined") return;

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
  userType?: RegistrationUserType
) {
  ensurePixelThenTrack(() => {
    const contentName =
      userType === "homeowner"
        ? "Homeowner Signup"
        : userType === "handyman"
          ? "Handyman Signup"
          : "SaskHandy Signup";

    window.fbq?.("track", "CompleteRegistration", {
      content_name: contentName,
      status: "completed",
      registration_method: method,
      user_type: userType ?? "unknown",
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
