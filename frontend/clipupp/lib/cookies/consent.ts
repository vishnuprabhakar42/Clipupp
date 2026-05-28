/**
 * GDPR-style cookie consent state. Lightweight client utility — no provider
 * needed because changes are infrequent and any subscriber can listen via the
 * `clipupp-consent-changed` window event.
 */
export type ConsentChoice = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
  version: number;
};

const STORAGE_KEY = "clipupp_consent";
const COOKIE_NAME = "clipupp_consent_v";
const VERSION = 1;
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentChoice;
    if (parsed.version !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(input: { analytics: boolean; marketing: boolean }) {
  if (typeof window === "undefined") return;
  const value: ConsentChoice = {
    necessary: true,
    analytics: input.analytics,
    marketing: input.marketing,
    decidedAt: new Date().toISOString(),
    version: VERSION,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  // Also drop a tiny cookie so the server can see consent on the next request.
  document.cookie = `${COOKIE_NAME}=${VERSION}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("clipupp-consent-changed", { detail: value }));
}

export function clearConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("clipupp-consent-changed", { detail: null }));
}
