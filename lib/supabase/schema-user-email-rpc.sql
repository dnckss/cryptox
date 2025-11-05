-- 사용자 이메일 조회를 위한 RPC 함수
-- auth.users 테이블에서 이메일을 조회할 수 있도록 하는 함수

CREATE OR REPLACE FUNCTION get_user_emails(user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id::UUID as user_id,
    au.email::TEXT as email
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS 정책 (관리자만 접근 가능)
-- 실제로는 이 함수를 호출하는 사용자가 관리자인지 확인해야 함
-- 하지만 SECURITY DEFINER로 정의되어 있으므로 함수 내부에서 체크 필요

