-- 世界树 · 认证系统升级脚本
-- 在 Supabase 控制台的 SQL Editor 里执行此脚本，升级 RLS 策略以支持 Supabase Auth。
-- 注意：执行前请先在 Supabase 控制台的 Authentication 页面中启用以下 Provider：
--   1. Email Provider（启用 "Enable email confirm" 如需验证邮箱）
--   2. Google Provider（需配置 Google Cloud OAuth 凭据）

-- ============================================================
-- 1. 更新 kv_shared 表策略：所有人可读，仅认证用户可写
-- ============================================================

-- 先删除旧的开放策略
drop policy if exists "任何人可读共享数据" on kv_shared;
drop policy if exists "任何人可写共享数据" on kv_shared;
drop policy if exists "任何人可更新共享数据" on kv_shared;

-- 读：所有人（包括匿名用户）都可以读取共享数据
create policy "所有人可读共享数据" on kv_shared
  for select using (true);

-- 写：仅认证用户可以写入共享数据
create policy "认证用户可写共享数据" on kv_shared
  for insert with check (auth.role() = 'authenticated');

-- 更新：仅认证用户可以更新共享数据
create policy "认证用户可更新共享数据" on kv_shared
  for update using (auth.role() = 'authenticated');

-- ============================================================
-- 2. 更新 kv_personal 表策略：按用户身份隔离个人数据
-- ============================================================

-- 先删除旧的开放策略
drop policy if exists "任何人可读个人数据" on kv_personal;
drop policy if exists "任何人可写个人数据" on kv_personal;
drop policy if exists "任何人可更新个人数据" on kv_personal;

-- 读：认证用户只能读自己的数据（visitor_id 匹配 auth.uid()）
-- 同时保留匿名用户通过 visitor_id 读取的能力
create policy "认证用户可读自己的数据" on kv_personal
  for select using (
    (auth.role() = 'authenticated' and visitor_id = auth.uid()::text)
    or
    (auth.role() <> 'authenticated')
  );

-- 写：认证用户只能写自己的数据
create policy "认证用户可写自己的数据" on kv_personal
  for insert with check (
    (auth.role() = 'authenticated' and visitor_id = auth.uid()::text)
    or
    (auth.role() <> 'authenticated')
  );

-- 更新：认证用户只能更新自己的数据
create policy "认证用户可更新自己的数据" on kv_personal
  for update using (
    (auth.role() = 'authenticated' and visitor_id = auth.uid()::text)
    or
    (auth.role() <> 'authenticated')
  );

-- ============================================================
-- 3. （可选）添加索引以提高查询性能
-- ============================================================
create index if not exists idx_kv_personal_visitor_id on kv_personal(visitor_id);
create index if not exists idx_kv_shared_key on kv_shared(key);
