import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabaseServer";

/**
 * 认证回调路由：处理 OAuth（Google 等）和魔法链接的跳转回调。
 * Supabase 在认证完成后将用户重定向到此路由，
 * 附带一个 code 参数，我们用它来交换会话。
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // 如果用户是从某个受保护页面触发的登录，可以在 redirectTo 中携带 next 参数
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 认证成功，重定向到目标页面
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Auth callback error:", error.message);
  }

  // 认证失败，重定向到首页并附带错误标识
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
