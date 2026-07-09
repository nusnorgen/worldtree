"use client";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client = false; // false=未初始化, null=不可用, object=真实客户端

/**
 * 按需获取浏览器端 Supabase 客户端。
 * 只在浏览器中创建真实客户端，SSR 期间返回 null。
 * 避免模块导入时因 SSR 环境导致客户端初始化错误。
 */
export function getSupabase() {
  if (_client !== false) return _client;

  // SSR / SSG 期间不可用
  if (typeof window === "undefined") {
    _client = null;
    return null;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase 环境变量未设置");
    _client = null;
    return null;
  }

  try {
    _client = createClient(supabaseUrl, supabaseAnonKey);
    return _client;
  } catch (e) {
    console.error("Supabase 客户端创建失败:", e);
    _client = null;
    return null;
  }
}
