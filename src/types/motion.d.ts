declare module 'motion/react' {
  export const motion: any;
  export const AnimatePresence: any;
  export const MotionConfig: any;
  export const LayoutGroup: any;
  export const Reorder: any;
  export type MotionValue<T = any> = any;
  export type HTMLMotionProps<T = any> = any;
  export type TargetAndTransition = any;
  export type PanInfo = any;
  export type MotionProps = any;
  export const useSpring: any;
  export const useTransform: any;
  export const useAnimation: any;
  export const useMotionValue: any;
  export const useDragControls: any;
  export const animate: any;
}

declare module '@sentry/nextjs' {
  export const init: any;
  export const captureException: any;
  export const captureMessage: any;
  export const withSentryConfig: any;
  export const wrapApiHandlerWithSentry: any;
  export const captureSession: any;
  export const configureScope: any;
  export const withScope: (callback: (scope: any) => void) => void;
  export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
  export const replayIntegration: any;
}
