import { createClient } from '@supabase/supabase-js';

// Enforce that this file can NEVER be bundled or executed in browser client components
if (typeof window !== 'undefined') {
  throw new Error('[CRITICAL SECURITY VIOLATION] supabase-admin module cannot be imported in the browser!');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseServiceKey.includes('placeholder') &&
  !supabaseServiceKey.includes('your_')
);

let adminClient = null;

/**
 * Returns privileged Supabase Service Role client for server-side only operations
 */
export function getServiceSupabase() {
  if (!isSupabaseAdminConfigured) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export const supabaseAdmin = {
  from(...args) {
    const client = getServiceSupabase();
    if (!client) throw new Error('Supabase service role client is not configured.');
    return client.from(...args);
  },
  rpc(...args) {
    const client = getServiceSupabase();
    if (!client) throw new Error('Supabase service role client is not configured.');
    return client.rpc(...args);
  },
};
