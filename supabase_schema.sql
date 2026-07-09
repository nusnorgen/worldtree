-- 世界树 · 数据库建表脚本
-- 在 Supabase 控制台的 SQL Editor 里，新建一个 Query，粘贴整段执行即可。

-- 共享表：所有访客可读写（建言、共识晶体等公共数据）
create table if not exists kv_shared (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- 个人表：按访客 id 区分（旅人档案、点赞记录等）
create table if not exists kv_personal (
  key text not null,
  visitor_id text not null,
  value jsonb not null,
  updated_at timestamptz default now(),
  primary key (key, visitor_id)
);

-- 开启行级安全（RLS）
alter table kv_shared enable row level security;
alter table kv_personal enable row level security;

-- 共享表：任何人都可以读和写（这是一个"共享留言板"性质的应用，
-- 建言本身设计为公开可写；如果未来需要防刷/防滥用，
-- 可以在此基础上加入更严格的策略，比如结合 Supabase Auth）
create policy "任何人可读共享数据" on kv_shared
  for select using (true);
create policy "任何人可写共享数据" on kv_shared
  for insert with check (true);
create policy "任何人可更新共享数据" on kv_shared
  for update using (true);

-- 个人表：同样开放读写（因为没有登录系统，靠浏览器本地生成的 visitor_id 区分身份，
-- 这是轻量方案，不是强安全边界）
create policy "任何人可读个人数据" on kv_personal
  for select using (true);
create policy "任何人可写个人数据" on kv_personal
  for insert with check (true);
create policy "任何人可更新个人数据" on kv_personal
  for update using (true);
