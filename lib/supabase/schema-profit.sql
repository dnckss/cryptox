-- transactions 테이블에 average_buy_price 컬럼 추가 (판매 수익 계산용)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS average_buy_price DECIMAL(20, 8);

-- 인덱스 추가 (판매 거래 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_type_created ON transactions(transaction_type, created_at DESC);

