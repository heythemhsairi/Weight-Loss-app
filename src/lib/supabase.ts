import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Single-user mode: server-side client using the anon key. No auth/session.
// (When you add Supabase Auth later, create a per-request client that forwards
//  the user's access token, and replace the anon RLS policies with per-user ones.)

// Read env INSIDE the function (not at module top-level) so values are resolved
// at request time on Vercel, not captured during build/prerender.

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment (Vercel → Settings → ' +
      'Environment Variables, then redeploy).'
    );
  }
  if (!client) {
    client = createClient(url, anon, { auth: { persistSession: false } });
  }
  return client;
}

export function isConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
