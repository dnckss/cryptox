/**
 * 코인 가격 WebSocket 훅
 * 실시간 코인 가격 업데이트를 위한 WebSocket 연결 관리
 */

import { useEffect, useRef, useState } from "react"

interface CoinPriceUpdate {
  coinId: string
  symbol: string
  price: number
  change1h: number
  change24h: number
  change1w: number
  marketCap: number
  volume24h: number
}

interface WebSocketMessage {
  type: "initial" | "update"
  data: CoinPriceUpdate[]
}

type OnUpdateCallback = (updates: CoinPriceUpdate[]) => void
type OnInitialCallback = (coins: CoinPriceUpdate[]) => void

export function useCoinWebSocket(
  onUpdate?: OnUpdateCallback,
  onInitial?: OnInitialCallback
) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    const connect = () => {
      try {
        // WebSocket URL 생성 (개발/프로덕션 환경 고려)
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
        const host = window.location.host
        const wsUrl = `${protocol}//${host}/api/ws/coins`

        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log("✅ WebSocket 연결 성공")
          setIsConnected(true)
          reconnectAttempts.current = 0
        }

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)

            if (message.type === "initial") {
              // 초기 데이터 수신
              if (onInitial) {
                onInitial(message.data)
              }
            } else if (message.type === "update") {
              // 가격 업데이트 수신
              if (onUpdate) {
                onUpdate(message.data)
              }
            }
          } catch (error) {
            console.error("WebSocket 메시지 파싱 오류:", error)
          }
        }

        ws.onerror = (error) => {
          console.error("WebSocket 에러:", error)
          setIsConnected(false)
        }

        ws.onclose = () => {
          console.log("WebSocket 연결 종료")
          setIsConnected(false)

          // 자동 재연결 시도
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000) // 지수 백오프

            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(`재연결 시도 ${reconnectAttempts.current}/${maxReconnectAttempts}...`)
              connect()
            }, delay)
          } else {
            console.error("WebSocket 재연결 실패: 최대 시도 횟수 초과")
          }
        }

        wsRef.current = ws
      } catch (error) {
        console.error("WebSocket 연결 오류:", error)
        setIsConnected(false)
      }
    }

    // 연결 시작
    connect()

    // 정리 함수
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [onUpdate, onInitial])

  return { isConnected }
}

