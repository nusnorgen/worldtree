import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 创建 Supabase 服务端客户端（用于路由处理器和服务端组件）。
 * 通过 cookies() 自动管理认证会话。
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (e) {
            // 在服务端组件中调用 set 会抛出异常，可安全忽略
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (e) {
            // 同上
          }
        },
      },
    }
  );
}
