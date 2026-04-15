declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export function trackCompleteRegistration(method: string = "website") {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "CompleteRegistration", {
      content_name: "Handyman Signup",
      status: "completed",
      registration_method: method,
    });
  }
}

export function trackLead(source: string = "website") {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "Lead", {
      content_name: "Handyman Interest",
      lead_source: source,
    });
  }
}