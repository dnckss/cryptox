-- 충전 내역 테이블 업데이트: 승인 상태 및 계좌 정보 추가

-- status 컬럼 추가 (pending: 승인 대기, approved: 승인, rejected: 거절)
ALTER TABLE charge_history 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- 계좌 정보 컬럼 추가
ALTER TABLE charge_history 
ADD COLUMN IF NOT EXISTS account_info TEXT; -- 입금자 계좌 정보

-- 입금 확인 메모 컬럼 추가
ALTER TABLE charge_history 
ADD COLUMN IF NOT EXISTS admin_note TEXT; -- 관리자 메모

-- 인덱스 추가 (승인 상태별 조회용)
CREATE INDEX IF NOT EXISTS idx_charge_history_status ON charge_history(status);
CREATE INDEX IF NOT EXISTS idx_charge_history_user_status ON charge_history(user_id, status);

