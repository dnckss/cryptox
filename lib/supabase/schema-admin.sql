-- 관리자 권한 시스템 추가

-- user_profiles 테이블에 is_admin 필드 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 인덱스 생성 (관리자 조회용)
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);

-- 특정 이메일을 관리자로 설정 (cryptoxmanage@gmail.com)
-- 이 부분은 Supabase Dashboard에서 직접 실행하거나, 
-- 아래 주석 처리된 쿼리를 사용하여 특정 사용자 ID로 관리자 권한 부여

-- 방법 1: 이메일로 관리자 권한 부여 (Supabase Dashboard SQL Editor에서 실행)
-- UPDATE user_profiles 
-- SET is_admin = true 
-- WHERE user_id IN (
--   SELECT id FROM auth.users WHERE email = 'cryptoxmanage@gmail.com'
-- );

-- 방법 2: 직접 user_id로 관리자 권한 부여
-- UPDATE user_profiles 
-- SET is_admin = true 
-- WHERE user_id = 'YOUR_USER_ID_HERE';

