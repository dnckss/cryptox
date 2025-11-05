/**
 * 코인 가격 조절 관리 (메모리 기반)
 * 관리자가 설정한 가격 변동 비율을 저장하고 적용
 */

// 코인별 가격 조절 비율 (coinId -> priceChangePercent)
const priceAdjustments = new Map<string, { percent: number; appliedAt: number }>()

/**
 * 코인 가격 조절 비율 설정
 * @param coinId 코인 ID
 * @param priceChangePercent 가격 변동 비율 (%)
 * @param delaySeconds 적용 시간 (초, 기본값: 3)
 */
export function setPriceAdjustment(coinId: string, priceChangePercent: number, delaySeconds: number = 3) {
  priceAdjustments.set(coinId, {
    percent: priceChangePercent,
    appliedAt: Date.now() + delaySeconds * 1000, // 설정한 시간 후 적용
  })
}

/**
 * 코인 가격 조절 비율 가져오기
 * @param coinId 코인 ID
 * @returns 가격 변동 비율 (%) 또는 null
 */
export function getPriceAdjustment(coinId: string): number | null {
  const adjustment = priceAdjustments.get(coinId)
  if (!adjustment) return null

  // 설정한 시간이 지났는지 확인
  if (Date.now() >= adjustment.appliedAt) {
    return adjustment.percent
  }

  return null
}

/**
 * 조절된 가격 적용
 * @param coinId 코인 ID
 * @param basePrice 기본 가격
 * @returns 조절된 가격
 */
export function applyPriceAdjustment(coinId: string, basePrice: number): number {
  const adjustment = getPriceAdjustment(coinId)
  if (adjustment === null) {
    return basePrice
  }

  return basePrice * (1 + adjustment / 100)
}

/**
 * 모든 가격 조절 비율 초기화
 */
export function clearPriceAdjustments() {
  priceAdjustments.clear()
}

/**
 * 특정 코인의 가격 조절 비율 초기화
 */
export function clearPriceAdjustment(coinId: string) {
  priceAdjustments.delete(coinId)
}

