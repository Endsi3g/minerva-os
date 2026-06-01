import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey && process.env.DEMO_MODE !== 'true') {
  console.error('[SECURITY] SUPABASE_SERVICE_ROLE_KEY is not set. All admin Supabase operations will fail.');
}

// Uses a non-functional placeholder when key is missing so the module loads during builds,
// but all admin DB calls will correctly reject at runtime.
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey ?? '__missing_service_role_key__',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
