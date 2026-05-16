import * as Sentry from 'sentry-expo';

export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
    enableInExpoDevelopment: false,
    debug: false,
    tracesSampleRate: 0.2,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const captureException = (err: unknown, context?: Record<string, any>) => {
  Sentry.Native.captureException(err, context ? { extra: context } : undefined);
};
