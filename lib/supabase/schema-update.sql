-- 트랜잭션 테이블 RLS 정책 업데이트
-- 모든 사용자가 다른 사용자의 거래 내역을 볼 수 있도록 (읽기 전용)
-- 단, 자신의 거래는 INSERT만 가능하도록 유지

-- 기존 정책 제거
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;

-- 모든 사용자가 모든 거래 내역을 볼 수 있도록 (공개 거래 내역)
CREATE POLICY "Anyone can view all transactions" ON transactions
  FOR SELECT USING (true);

-- 사용자는 자신의 거래만 INSERT 가능
CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

