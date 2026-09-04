"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/**
 * Creates the browser Supabase client only when it is actually needed.
 * This keeps build/prerender phases independent from local environment setup.
 */
export function createClientSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000),
    },
    db: {
      schema: "public",
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Backwards-compatible singleton-style export for existing consumers.
 * It is created lazily through the same validated factory.
 */
export const supabase = new Proxy({} as ReturnType<typeof createClientSupabase>, {
  get(_target, property, receiver) {
    const client = createClientSupabase();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const supabaseAuth = new Proxy(supabase.auth, {
  get(_target, property, receiver) {
    const auth = createClientSupabase().auth;
    const value = Reflect.get(auth, property, receiver);
    return typeof value === "function" ? value.bind(auth) : value;
  },
});

export async function getAuthenticatedUser() {
  const client = createClientSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  const client = createClientSupabase();
  const { data } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data;
}

export async function getProducts() {
  const client = createClientSupabase();
  const { data, error } = await client
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
