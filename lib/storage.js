"use client";
import { supabase } from "./supabaseClient";

/* 本地旅人身份：用一个随机 id 存在浏览器 localStorage 里，
   用来区分"个人数据"（如档案、点赞记录）。
   共享数据（建言、共识晶体）不区分身份，所有人可见可写。 */
function getVisitorId() {
  if (typeof window === "undefined") return "anon";
  let id = localStorage.getItem("wt-visitor-id");
  if (!id) {
    id = "v-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("wt-visitor-id", id);
  }
  return id;
}

/* 与原代码里的 sGet / sSet 签名保持一致：
   get(key, shared) / set(key, value, shared)
   shared=true  -> 存到 kv_shared 表，所有访客共用同一行
   shared=false -> 存到 kv_personal 表，按 visitor_id 区分 */
export async function sGet(key, shared = false) {
  try {
    const table = shared ? "kv_shared" : "kv_personal";
    let query = supabase.from(table).select("value").eq("key", key);
    if (!shared) query = query.eq("visitor_id", getVisitorId());
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data ? data.value : null;
  } catch (e) {
    console.error("sGet error:", e);
    return null;
  }
}

export async function sSet(key, val, shared = false) {
  try {
    const table = shared ? "kv_shared" : "kv_personal";
    const row = shared
      ? { key, value: val, updated_at: new Date().toISOString() }
      : { key, value: val, visitor_id: getVisitorId(), updated_at: new Date().toISOString() };
    const conflictCols = shared ? "key" : "key,visitor_id";
    const { error } = await supabase.from(table).upsert(row, { onConflict: conflictCols });
    if (error) throw error;
  } catch (e) {
    console.error("sSet error:", e);
  }
}
