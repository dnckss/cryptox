-- 관리자 충전 관리 RLS 정책 추가
-- 관리자가 charge_history를 조회하고 업데이트할 수 있도록

-- 기존 정책이 이미 존재하는지 확인하고, 없으면 추가
-- (PostgreSQL에서는 CREATE POLICY IF NOT EXISTS를 지원하지 않으므로, DROP 후 재생성)

-- charge_history 테이블에 관리자 조회 정책 추가 (이미 ranking용으로 있을 수 있음)
DROP POLICY IF EXISTS "Anyone can view all charge history for admin" ON charge_history;
CREATE POLICY "Anyone can view all charge history for admin" ON charge_history
  FOR SELECT USING (true);

-- charge_history 테이블에 관리자 업데이트 정책 추가
DROP POLICY IF EXISTS "Anyone can update charge history for admin" ON charge_history;
CREATE POLICY "Anyone can update charge history for admin" ON charge_history
  FOR UPDATE USING (true);

-- 기존 정책은 유지 (사용자는 자신의 데이터만 조회/삽입 가능)

