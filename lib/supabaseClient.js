"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * 创建 Supabase 浏览器客户端（延迟初始化，避免 SSG 时因缺少环境变量而报错）。
 */

let client = null;

function getSupabase() {
  if (client) return client;

  // 在浏览器端：使用真实的环境变量创建客户端
  if (typeof window !== "undefined") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      client = createBrowserClient(url, key);
      return client;
    }
    console.warn("Supabase 环境变量未设置，请检查 .env.local 或 Vercel 配置。");
  }

  // 在 SSR/SSG 期间或环境变量缺失时，返回 stub
  return createStub();
}

function createStub() {
  const noop = () => Promise.resolve({ data: null, error: null });
  const noopSession = () =>
    Promise.resolve({ data: { session: null, user: null }, error: null });
  return {
    auth: {
      getSession: noopSession,
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: noop,
      signUp: noop,
      signInWithOtp: noop,
      signInWithOAuth: noop,
      signOut: noop,
      exchangeCodeForSession: noop,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
    }),
  };
}

/**
 * 导出 Supabase 客户端实例。
 * 所有方法调用通过 Proxy 转发，确保延迟初始化的客户端能被正常访问。
 */
export const supabase = new Proxy({}, {
  get(_, method) {
    const real = getSupabase();
    const val = real[method];
    return typeof val === "function" ? val.bind(real) : val;
  },
});
