-- 在 Supabase SQL Editor 中执行此脚本创建 car_state 表

CREATE TABLE IF NOT EXISTS car_state (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_public BOOLEAN NOT NULL DEFAULT true,
  owner_id UUID REFERENCES auth.users(id)
);

-- 启用 RLS
ALTER TABLE car_state ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取公开数据
CREATE POLICY "Public read" ON car_state
  FOR SELECT USING (is_public = true);

-- 允许已登录用户写入自己的数据
CREATE POLICY "Authenticated write" ON car_state
  FOR ALL USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 允许匿名读取（用于未登录时）
CREATE POLICY "Anon read" ON car_state
  FOR SELECT TO anon USING (is_public = true);

-- 允许已认证用户读取
CREATE POLICY "Auth read" ON car_state
  FOR SELECT TO authenticated USING (true);

-- 允许已认证用户插入/更新
CREATE POLICY "Auth insert" ON car_state
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update" ON car_state
  FOR UPDATE TO authenticated USING (true);
