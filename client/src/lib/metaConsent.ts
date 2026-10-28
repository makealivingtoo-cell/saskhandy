import { metaAttributionSchema, type MetaAttribution } from "@shared/metaConversions";

const KEY = "saskhandy-meta-consent-v1";
export const META_CONSENT_CHANGED = "saskhandy-meta-consent-changed";

export function metaConsentChoice(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function hasMetaConsent(): boolean {
  if (typeof navigator === "undefined") return false;
  if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false;
  return metaConsentChoice() === "granted";
}

export function setMetaConsent(granted: boolean) {
  try { localStorage.setItem(KEY, granted ? "granted" : "denied"); } catch { /* Fail closed. */ }
  window.dispatchEvent(new Event(META_CONSENT_CHANGED));
}

export function getMetaAttribution(): MetaAttribution | undefined {
  if (!hasMetaConsent()) return undefined;
  try {
    const cookie = (name: string) => document.cookie.split("; ")
      .find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
    const candidate = { consent: true, fbp: cookie("_fbp"), fbc: cookie("_fbc") };
    const result = metaAttributionSchema.safeParse(candidate);
    return result.success ? result.data : { consent: true };
  } catch { return { consent: true }; }
}
