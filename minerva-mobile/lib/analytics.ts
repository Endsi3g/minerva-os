// Analytics wrapper — swap internals for PostHog/Mixpanel without touching callers.
declare const __DEV__: boolean;

export function trackScreen(_name: string): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return;
  // PostHog.screen(_name);
}

export function trackEvent(_name: string, _props?: Record<string, unknown>): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return;
  // PostHog.capture(_name, _props);
}
