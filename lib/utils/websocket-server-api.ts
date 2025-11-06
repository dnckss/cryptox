/**
 * WebSocket 서버 HTTP API 유틸리티
 * WebSocket 서버를 마스터로 사용하여 가격 동기화
 */

/**
 * WebSocket 서버의 HTTP API URL 가져오기
 * WebSocket URL에서 프로토콜과 호스트를 추출하여 HTTP URL로 변환
 */
function getWebSocketServerApiUrl(): string {
  // 환경 변수에서 WebSocket 서버 URL 가져오기
  const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://cryptox-websocket.onrender.com/api/ws/coins"
  
  // WebSocket URL을 HTTP URL로 변환
  // wss:// -> https://, ws:// -> http://
  const httpUrl = wsUrl
    .replace(/^wss?:\/\//, "https://")
    .replace(/^ws:\/\//, "http://")
    .replace(/\/api\/ws\/coins$/, "")
  
  return httpUrl
}

/**
 * WebSocket 서버에서 모든 코인 가격 가져오기
 * @returns 코인 가격 맵 (symbol -> price) 또는 null (실패 시)
 */
export async function syncPricesFromWebSocketServer(): Promise<Map<string, number> | null> {
  try {
    const baseUrl = getWebSocketServerApiUrl()
    const response = await fetch(`${baseUrl}/api/prices`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // 서버 사이드에서만 사용되므로 cache 제어
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`⚠️ WebSocket 서버 가격 동기화 실패: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    
    if (!data.success || !data.prices) {
      console.error("⚠️ WebSocket 서버 응답 형식 오류:", data)
      return null
    }

    // 가격 맵 생성
    const priceMap = new Map<string, number>()
    for (const [symbol, price] of Object.entries(data.prices)) {
      if (typeof price === "number" && price > 0) {
        priceMap.set(symbol.toLowerCase(), price)
      }
    }

    console.log(`✅ WebSocket 서버에서 ${priceMap.size}개 코인 가격 동기화 완료`)
    return priceMap
  } catch (error) {
    console.error("❌ WebSocket 서버 가격 동기화 오류:", error)
    return null
  }
}

/**
 * WebSocket 서버에서 특정 코인 가격 가져오기
 * @param symbol 코인 심볼 (소문자)
 * @returns 가격 또는 null (실패 시)
 */
export async function getPriceFromWebSocketServer(symbol: string): Promise<number | null> {
  const normalizedSymbol = symbol.toLowerCase()
  try {
    const baseUrl = getWebSocketServerApiUrl()
    const response = await fetch(`${baseUrl}/api/prices/${normalizedSymbol}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`⚠️ WebSocket 서버에서 코인 ${normalizedSymbol} 가격 조회 실패: ${response.status}`)
      return null
    }

    const data = await response.json()
    
    if (!data.success || typeof data.price !== "number" || data.price <= 0) {
      console.error("⚠️ WebSocket 서버 응답 형식 오류:", data)
      return null
    }

    return data.price
  } catch (error) {
    console.error(`❌ WebSocket 서버에서 코인 ${normalizedSymbol} 가격 조회 오류:`, error)
    return null
  }
}

/**
 * WebSocket 서버에 가격 업데이트 요청 (관리자용)
 * @param symbol 코인 심볼 (소문자)
 * @param newPrice 새로운 가격
 * @returns 성공 여부
 */
export async function updatePriceOnWebSocketServer(symbol: string, newPrice: number): Promise<boolean> {
  try {
    const baseUrl = getWebSocketServerApiUrl()
    const normalizedSymbol = symbol.toLowerCase()
    const response = await fetch(`${baseUrl}/api/prices/${normalizedSymbol}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price: newPrice,
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`⚠️ WebSocket 서버 가격 업데이트 실패: ${response.status} ${response.statusText}`)
      return false
    }

    const data = await response.json()
    
    if (!data.success) {
      console.error("⚠️ WebSocket 서버 가격 업데이트 실패:", data)
      return false
    }

    console.log(`✅ WebSocket 서버에 코인 ${normalizedSymbol} 가격 업데이트 완료: ${newPrice}`)
    return true
  } catch (error) {
    console.error(`❌ WebSocket 서버 가격 업데이트 오류:`, error)
    return false
  }
}

