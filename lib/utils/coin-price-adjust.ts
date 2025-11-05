/**
 * 코인 가격 조절 관리 (메모리 기반)
 * 관리자가 설정한 새로운 가격을 저장하고 적용
 */

// 코인별 새로운 가격 (symbol -> { newPrice, appliedAt })
const priceAdjustments = new Map<string, { newPrice: number; appliedAt: number }>()

/**
 * 코인 가격 조절 설정
 * @param symbol 코인 심볼 (소문자)
 * @param newPrice 새로운 가격
 * @param delaySeconds 적용 시간 (초)
 */
export function setPriceAdjustment(symbol: string, newPrice: number, delaySeconds: number = 3) {
  const normalizedSymbol = symbol.toLowerCase()
  priceAdjustments.set(normalizedSymbol, {
    newPrice: newPrice,
    appliedAt: Date.now() + delaySeconds * 1000, // 설정한 시간 후 적용
  })
  console.log(`💰 가격 조절 설정: ${normalizedSymbol} → ${newPrice.toFixed(2)}원 (${delaySeconds}초 후 적용)`)
}

/**
 * 코인 가격 조절 가져오기 (적용 시간이 지났는지 확인)
 * @param symbol 코인 심볼 (소문자)
 * @returns 새로운 가격 또는 null
 */
export function getPriceAdjustment(symbol: string): number | null {
  const normalizedSymbol = symbol.toLowerCase()
  const adjustment = priceAdjustments.get(normalizedSymbol)
  if (!adjustment) return null

  // 설정한 시간이 지났는지 확인
  if (Date.now() >= adjustment.appliedAt) {
    return adjustment.newPrice
  }

  return null
}

/**
 * 가격 조절이 적용되었는지 확인
 * @param symbol 코인 심볼 (소문자)
 * @returns 이미 적용되었는지 여부
 */
export function isPriceAdjustmentApplied(symbol: string): boolean {
  const normalizedSymbol = symbol.toLowerCase()
  const adjustment = priceAdjustments.get(normalizedSymbol)
  if (!adjustment) return false
  
  return Date.now() >= adjustment.appliedAt
}

/**
 * 특정 코인의 가격 조절 제거 (적용 후 호출)
 * @param symbol 코인 심볼 (소문자)
 */
export function clearPriceAdjustment(symbol: string) {
  const normalizedSymbol = symbol.toLowerCase()
  priceAdjustments.delete(normalizedSymbol)
  console.log(`✅ 가격 조절 제거: ${normalizedSymbol}`)
}

/**
 * 모든 가격 조절 초기화
 */
export function clearPriceAdjustments() {
  priceAdjustments.clear()
  console.log("🗑️ 모든 가격 조절 초기화")
}
