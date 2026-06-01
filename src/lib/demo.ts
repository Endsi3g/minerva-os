/**
 * Returns true when DEMO_MODE=true is set in the environment.
 * In demo mode: auth is bypassed (mock user), mock portal tokens are accepted,
 * and workspace ownership checks are skipped. All security checks remain active
 * in production (DEMO_MODE not set or set to any other value).
 */
export const isDemoMode = () => process.env.DEMO_MODE === 'true';

export const DEMO_WORKSPACE_ID = 'mock-workspace-123';

export const DEMO_USER_ID = 'demo-user-01';
