import * as Sentry from "@sentry/nextjs";

export function captureException(
  error: unknown,
  context?: Record<string, unknown>
) {
  Sentry.withScope((scope) => {
    if (context) scope.setContext("extra", context);
    Sentry.captureException(error);
  });
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info"
) {
  Sentry.captureMessage(message, level);
}
