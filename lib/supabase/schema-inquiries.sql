-- 사용자 문의사항 테이블
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 작성자
  title TEXT NOT NULL, -- 문의 제목
  content TEXT NOT NULL, -- 문의 내용
  status TEXT NOT NULL DEFAULT 'pending', -- 상태: pending, answered, closed
  admin_response TEXT, -- 관리자 답변
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 답변한 관리자
  answered_at TIMESTAMPTZ, -- 답변 시간
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_admin_id ON inquiries(admin_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view their own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can insert their own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can update inquiries" ON inquiries;

-- RLS 정책: 사용자는 자신의 문의만 조회할 수 있음
CREATE POLICY "Users can view their own inquiries" ON inquiries
  FOR SELECT USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 문의만 작성할 수 있음
CREATE POLICY "Users can insert their own inquiries" ON inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 관리자는 모든 문의를 조회할 수 있음
CREATE POLICY "Admins can view all inquiries" ON inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- RLS 정책: 관리자는 문의를 수정/답변할 수 있음
CREATE POLICY "Admins can update inquiries" ON inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 업데이트 트리거
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

