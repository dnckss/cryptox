/**
 * WebSocket URL 유틸리티
 * 환경 변수 또는 기본값을 사용하여 WebSocket URL 생성
 */

export function getWebSocketUrl(): string {
  // 환경 변수에서 WebSocket URL 가져오기
  const envWsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL

  if (envWsUrl) {
    return envWsUrl
  }

  // 환경 변수가 없으면 기존 로직 사용 (클라이언트 사이드)
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.host
    return `${protocol}//${host}/api/ws/coins`
  }

  // 서버 사이드 기본값 (사용되지 않지만 타입 안정성을 위해)
  return "ws://localhost:3001/api/ws/coins"
}

