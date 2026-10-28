import { useEffect, useState } from "react";
import { META_CONSENT_CHANGED, metaConsentChoice, setMetaConsent } from "@/lib/metaConsent";

export function MetaConsent() {
  const [open, setOpen] = useState(() => metaConsentChoice() === null);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener(META_CONSENT_CHANGED, close);
    return () => window.removeEventListener(META_CONSENT_CHANGED, close);
  }, []);
  if (!open) return <button type="button" onClick={() => setOpen(true)}
    className="fixed bottom-2 left-2 z-40 rounded border bg-white px-2 py-1 text-xs text-gray-700 shadow-sm">Ad privacy</button>;
  return <section aria-label="Meta advertising privacy" className="fixed bottom-4 left-4 right-4 z-50 max-w-lg rounded-xl border bg-white p-5 text-gray-900 shadow-xl">
    <p className="font-semibold">Help us measure our ads</p>
    <p className="mt-2 text-sm">With your permission, we share website activity, browser identifiers and a hashed version of your email with Meta to measure and improve SaskHandy ads. This is optional. You can change your choice under Ad privacy.</p>
    <a className="mt-2 inline-block text-sm underline" href="/privacy#cookies">Privacy details</a>
    <div className="mt-4 flex gap-3">
      <button type="button" className="rounded border px-4 py-2 text-sm" onClick={() => setMetaConsent(false)}>Decline</button>
      <button type="button" className="rounded border px-4 py-2 text-sm" onClick={() => setMetaConsent(true)}>Allow Meta tracking</button>
    </div>
  </section>;
}
