-- 사용자 자산 테이블
CREATE TABLE IF NOT EXISTS user_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 50000000, -- 잔고 (기본: 5000만원)
  initial_balance BIGINT NOT NULL DEFAULT 50000000, -- 초기 자본
  total_charged BIGINT NOT NULL DEFAULT 0, -- 총 충전 금액 (실제 결제 금액)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 사용자별 코인 보유 테이블
CREATE TABLE IF NOT EXISTS user_coin_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL, -- 코인 심볼 (예: bitcoin, ethereum)
  amount DECIMAL(20, 8) NOT NULL DEFAULT 0, -- 보유 수량
  average_buy_price DECIMAL(20, 8) NOT NULL DEFAULT 0, -- 평균 매수가
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, coin_id)
);

-- 거래 내역 테이블
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'buy' or 'sell'
  amount DECIMAL(20, 8) NOT NULL, -- 거래 수량
  price DECIMAL(20, 8) NOT NULL, -- 거래 시 가격
  total_value BIGINT NOT NULL, -- 총 거래 금액 (원)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 충전 내역 테이블
CREATE TABLE IF NOT EXISTS charge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  virtual_amount BIGINT NOT NULL, -- 충전된 가상 자산 (원)
  real_price BIGINT NOT NULL, -- 실제 결제 금액 (원)
  package_id TEXT NOT NULL, -- 패키지 ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_assets_user_id ON user_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coin_holdings_user_id ON user_coin_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coin_holdings_coin_id ON user_coin_holdings(coin_id);
CREATE INDEX IF NOT EXISTS idx_user_coin_holdings_user_coin ON user_coin_holdings(user_id, coin_id); -- 복합 인덱스 (자주 함께 조회됨)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_coin_id ON transactions(coin_id); -- 코인별 거래 내역 조회용
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_coin ON transactions(user_id, coin_id); -- 복합 인덱스 (특정 사용자의 특정 코인 거래 내역)
CREATE INDEX IF NOT EXISTS idx_charge_history_user_id ON charge_history(user_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coin_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE charge_history ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 데이터만 조회/수정 가능
CREATE POLICY "Users can view their own assets" ON user_assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets" ON user_assets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets" ON user_assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own coin holdings" ON user_coin_holdings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own coin holdings" ON user_coin_holdings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own charge history" ON charge_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own charge history" ON charge_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거
CREATE TRIGGER update_user_assets_updated_at BEFORE UPDATE ON user_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_coin_holdings_updated_at BEFORE UPDATE ON user_coin_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

