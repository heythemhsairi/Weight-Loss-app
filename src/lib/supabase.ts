import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Single-user mode: server-side client using the anon key. No auth/session.
// (When you add Supabase Auth later, create a per-request client that forwards
//  the user's access token, and replace the anon RLS policies with per-user ones.)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!url || !anon) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env.local and set ' +
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your project ' +
      '(Dashboard → Settings → API).'
    );
  }
  if (!client) {
    client = createClient(url, anon, { auth: { persistSession: false } });
  }
  return client;
}

export function isConfigured(): boolean {
  return !!(url && anon);
}
