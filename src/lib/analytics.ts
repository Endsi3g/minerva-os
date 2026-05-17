import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: true,
    persistence: "localStorage",
  });
  initialized = true;
}

export function trackEvent(event: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, props);
}

export function identifyUser(id: string, email: string, name?: string) {
  if (!initialized) return;
  posthog.identify(id, { email, name });
}

export function resetUser() {
  if (!initialized) return;
  posthog.reset();
}
