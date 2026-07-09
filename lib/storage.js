"use client";
import { supabase } from "./supabaseClient";

/**
 * 获取当前用户标识符。
 * 优先使用 Supabase Auth 的真实用户 ID，
 * 未登录时回退到 localStorage 中的匿名 visitor_id。
 */
async function getUserId() {
  if (typeof window === "undefined") return "anon";

  // 尝试获取已登录用户
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user.id;

  // 回退到匿名访客 ID
  let id = localStorage.getItem("wt-visitor-id");
  if (!id) {
    id = "v-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("wt-visitor-id", id);
  }
  return id;
}

/**
 * 从 Supabase 读取数据。
 */
export async function sGet(key, shared = false) {
  try {
    const table = shared ? "kv_shared" : "kv_personal";
    let query = supabase.from(table).select("value").eq("key", key);
    if (!shared) query = query.eq("visitor_id", await getUserId());
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data ? data.value : null;
  } catch (e) {
    console.error("sGet error:", e);
    return null;
  }
}

/**
 * 向 Supabase 写入数据。
 */
export async function sSet(key, val, shared = false) {
  try {
    const table = shared ? "kv_shared" : "kv_personal";
    const uid = await getUserId();
    const row = shared
      ? { key, value: val, updated_at: new Date().toISOString() }
      : { key, value: val, visitor_id: uid, updated_at: new Date().toISOString() };
    const conflictCols = shared ? "key" : "key,visitor_id";
    const { error } = await supabase
      .from(table)
      .upsert(row, { onConflict: conflictCols });
    if (error) throw error;
  } catch (e) {
    console.error("sSet error:", e);
  }
}
