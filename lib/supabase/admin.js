import { createClient } from '@supabase/supabase-js';

// Fallback to dummy values during build-time / SSR static page collection so module evaluation never throws
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Service role client bypasses RLS policies for server-only operations (wallets, cron, admin actions).
// NEVER export or expose this client in client components!
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
