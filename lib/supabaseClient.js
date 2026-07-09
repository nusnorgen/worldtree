"use client";
import { createClient } from "@supabase/supabase-js";

/** 规范化 Supabase URL，去除误加的 /rest/v1 等后缀 */
function normalizeUrl(url) {
  if (!url) return url;
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase 浏览器客户端。
 * 通过 createClient (supabase-js) 创建，兼容 Auth + REST。
 * "use client" 确保只在浏览器端执行。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
