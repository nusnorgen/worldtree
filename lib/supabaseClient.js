"use client";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Supabase 浏览器客户端单例 */
let client = null;

export function getSupabaseBrowserClient() {
  if (client) return client;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 环境变量未设置。请在 .env.local 或 Vercel 环境变量中配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}

/**
 * 导出一个在 SSR/静态生成期间安全的 Supabase 客户端。
 * 在浏览器中：返回真实客户端
 * 在服务端：返回一个空操作的桩
 */
export const supabase = typeof window === "undefined"
  ? createServerStub()
  : getSupabaseBrowserClient();

function createServerStub() {
  const noop = () => Promise.resolve({ data: null, error: null });
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: noop,
      signUp: noop,
      signInWithOtp: noop,
      signInWithOAuth: noop,
      exchangeCodeForSession: noop,
      signOut: noop,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
    }),
  };
}
