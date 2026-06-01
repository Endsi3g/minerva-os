import * as Sentry from '@sentry/react-native';

export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
    enabled: !__DEV__,
    debug: false,
    tracesSampleRate: 0.2,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const captureException = (err: unknown, context?: Record<string, any>) => {
  Sentry.captureException(err, context ? { extra: context } : undefined);
};
