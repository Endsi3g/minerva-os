import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder';

// createBrowserClient stores the session in cookies so the SSR middleware
// (updateSession) can read it server-side. Using createClient here would
// store the session in localStorage, invisible to the middleware, causing
// an auth redirect loop after login.
export const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);

