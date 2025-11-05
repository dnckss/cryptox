-- 랭킹 시스템을 위한 RLS 정책 업데이트 (기존 정책 확인 후 추가)
-- 모든 사용자가 다른 사용자의 자산 정보를 조회할 수 있도록 (랭킹용)

-- 기존 정책이 이미 존재하는지 확인하고, 없으면 추가
-- (PostgreSQL에서는 CREATE POLICY IF NOT EXISTS를 지원하지 않으므로, DROP 후 재생성)

-- user_assets 테이블에 랭킹 조회 정책 추가
DROP POLICY IF EXISTS "Anyone can view all assets for ranking" ON user_assets;
CREATE POLICY "Anyone can view all assets for ranking" ON user_assets
  FOR SELECT USING (true);

-- user_profiles 테이블에 랭킹 조회 정책 추가 (닉네임 표시용)
DROP POLICY IF EXISTS "Anyone can view all profiles for ranking" ON user_profiles;
CREATE POLICY "Anyone can view all profiles for ranking" ON user_profiles
  FOR SELECT USING (true);

-- user_coin_holdings 테이블에 랭킹 조회 정책 추가 (보유 코인 가치 계산용)
DROP POLICY IF EXISTS "Anyone can view all coin holdings for ranking" ON user_coin_holdings;
CREATE POLICY "Anyone can view all coin holdings for ranking" ON user_coin_holdings
  FOR SELECT USING (true);

-- charge_history 테이블에 랭킹 조회 정책 추가 (충전 내역 계산용)
DROP POLICY IF EXISTS "Anyone can view all charge history for ranking" ON charge_history;
CREATE POLICY "Anyone can view all charge history for ranking" ON charge_history
  FOR SELECT USING (true);

-- 기존 정책은 유지 (자신의 데이터는 여전히 업데이트 가능)

