-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- 공지 제목
  content TEXT NOT NULL, -- 공지 내용
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 작성자 (관리자)
  view_count INTEGER NOT NULL DEFAULT 0, -- 조회 횟수
  is_active BOOLEAN NOT NULL DEFAULT true, -- 활성화 여부
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 공지 조회 기록 테이블 (중복 조회 방지용)
CREATE TABLE IF NOT EXISTS announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, user_id) -- 한 사용자는 한 공지를 한 번만 조회로 카운트
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcement_views_announcement_id ON announcement_views(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_views_user_id ON announcement_views(user_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Users can view their own announcement views" ON announcement_views;
DROP POLICY IF EXISTS "Users can insert their own announcement views" ON announcement_views;

-- RLS 정책: 모든 사용자는 공지를 조회할 수 있음
CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT USING (is_active = true);

-- RLS 정책: 관리자만 공지를 작성/수정/삭제할 수 있음

-- 관리자 정책 생성 (user_profiles의 is_admin 또는 관리자 이메일 확인)
CREATE POLICY "Admins can insert announcements" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'cryptoxmanage@gmail.com'
    )
  );

CREATE POLICY "Admins can update announcements" ON announcements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'cryptoxmanage@gmail.com'
    )
  );

CREATE POLICY "Admins can delete announcements" ON announcements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'cryptoxmanage@gmail.com'
    )
  );

-- RLS 정책: 사용자는 자신의 조회 기록을 조회할 수 있음
CREATE POLICY "Users can view their own announcement views" ON announcement_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own announcement views" ON announcement_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 업데이트 트리거
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

