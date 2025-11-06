"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUp, ArrowDown, ChevronDown, ChevronUp, Settings, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TradingViewChart, type CandleDataPoint, type LineDataPoint } from "@/components/tradingview-chart"
import { OrderTicketSheet } from "@/components/order-ticket-sheet"
import { getWebSocketUrl } from "@/lib/utils/websocket-url"

interface CoinDetailPageProps {
  symbol: string
}

interface CoinData {
  id: string
  name: string
  symbol: string
  price: number
  change1h?: number
  change24h: number
  change1w?: number
  change24hValue: number
  tvl: number
  marketCap: number
  fdv: number
  volume24h: number
  description: string
}

interface CandleData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

// 폴백 데이터 (API 실패 시 사용)
function getFallbackCoinData(symbol: string): CoinData {
  return {
    id: symbol.toLowerCase(),
    name: symbol,
    symbol: symbol.toUpperCase(),
    price: 1000,
    change1h: 0,
    change24h: 0,
    change1w: 0,
    change24hValue: 0,
    tvl: 0,
    marketCap: 0,
    fdv: 0,
    volume24h: 0,
    description: `${symbol} is a cryptocurrency...`,
  }
}

export function CoinDetailPage({ symbol }: CoinDetailPageProps) {
  const router = useRouter()
  const [coin, setCoin] = useState<CoinData>(getFallbackCoinData(symbol))
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [chartTimeframe, setChartTimeframe] = useState<"1H" | "1D" | "1W" | "1M" | "1Y">("1D")
  const [chartType, setChartType] = useState<"line" | "candlestick">("line")
  const [chartData, setChartData] = useState<number[]>([])
  const [candleData, setCandleData] = useState<CandleData[]>([])
  const [chartWidth, setChartWidth] = useState(800)
  
  // 통계 고정값 (처음 로드 시 한 번만 설정)
  const [fixedStats, setFixedStats] = useState<{
    tvl: number
    marketCap: number
    fdv: number
    volume24h: number
  } | null>(null)
  
  // 구입
  const [buyAmount, setBuyAmount] = useState("0")
  const [buyAmountKRW, setBuyAmountKRW] = useState("0") // 원화 금액
  
  // 판매
  const [sellAmount, setSellAmount] = useState("0") // 코인 수량
  const [sellAmountKRW, setSellAmountKRW] = useState("0") // 원화 금액
  
  // 보유량
  const [holding, setHolding] = useState<{
    amount: number
    averageBuyPrice: number
  } | null>(null)
  const [loadingHolding, setLoadingHolding] = useState(true)
  
  // 거래 처리 중
  const [trading, setTrading] = useState(false)
  
  // 모바일 주문 티켓 시트 상태
  const [orderSheetOpen, setOrderSheetOpen] = useState(false)

  // 실제 거래 내역 상태
  const [transactions, setTransactions] = useState<Array<{
    id: string
    type: "buy" | "sell"
    amount: number
    price: number
    createdAt: string
  }>>([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)

  // 차트 기간을 CoinGecko days 파라미터로 변환
  const getDaysParam = (timeframe: "1H" | "1D" | "1W" | "1M" | "1Y"): number | "max" => {
    switch (timeframe) {
      case "1H":
        return 1 // 1일 데이터에서 시간별로 표시
      case "1D":
        return 1
      case "1W":
        return 7
      case "1M":
        return 30
      case "1Y":
        return 365
      default:
        return 1
    }
  }

  // 통계 데이터만 API에서 가져오기 (가격은 WebSocket에서만 받음)
  useEffect(() => {
    async function fetchStatsData() {
      try {
        const response = await fetch(`/api/coins/${symbol}`)
        if (response.ok) {
          const result = await response.json()
          if (result.data && !fixedStats) {
            // 통계는 처음 한 번만 고정값으로 설정
            setFixedStats({
              tvl: result.data.tvl || 0,
              marketCap: result.data.marketCap || 0,
              fdv: result.data.fdv || 0,
              volume24h: result.data.volume24h || 0,
            })
          }
        }
      } catch (error) {
        console.error("❌ 통계 데이터 로드 오류:", error)
        // 에러 시 기본값 사용
        if (!fixedStats) {
          setFixedStats({
            tvl: 0,
            marketCap: 0,
            fdv: 0,
            volume24h: 0,
          })
        }
      }
    }

    fetchStatsData()
  }, [symbol, fixedStats])

  // 차트 데이터 가져오기
  useEffect(() => {
    async function fetchChartData() {
      try {
        setChartLoading(true)
        const days = getDaysParam(chartTimeframe)
        const response = await fetch(`/api/coins/${symbol}/chart?days=${days}`)
        if (!response.ok) {
          throw new Error("Failed to fetch chart data")
        }
        const result = await response.json()
        if (result.data && result.data.length > 0) {
          // API 응답: 숫자 또는 문자열 배열 [price1, price2, ...] 또는 ["1234.5", "1236.2", ...]
          // lightweight-charts 요구사항: { time: number(초), value: number }[] (오름차순 정렬)
          
          // ✅ 문자열 배열을 숫자로 변환하고 NaN 필터링
          const raw = result.data as any[]
          const prices = raw
            .map((v) => Number(v))
            .filter((v) => Number.isFinite(v) && v > 0)
          
          if (!prices.length) {
            console.warn("⚠️ 유효한 숫자 가격 데이터가 없음");
            setChartData([coin.price])
            setCandleData([])
            return
          }
          
          const now = Math.floor(Date.now() / 1000) // 현재 시각 (초 단위)
          
          setChartData(prices) // 원본 가격 배열 유지 (캔들 생성용)
          
          // 캔들 데이터 생성 (라인 차트 데이터 기반)
          const candles = generateCandleData(prices, chartTimeframe, now)
          setCandleData(candles)
        } else {
          console.warn("⚠️ 차트 데이터가 비어있음, 현재 가격으로 대체");
          // 차트 데이터가 없으면 현재 가격으로 고정된 배열 생성
          setChartData([coin.price])
          setCandleData([])
        }
      } catch (error) {
        console.error("Error fetching chart data:", error)
        // 에러 시 현재 가격으로 고정된 배열 생성
        setChartData([coin.price])
        setCandleData([])
      } finally {
        setChartLoading(false)
      }
    }

    if (!loading && coin.price > 0) {
      fetchChartData()
    }
  }, [symbol, chartTimeframe, loading]) // coin.price 제거 - 가격 변경 시 전체 리로드하지 않음
  
  // 캔들 데이터 생성 함수
  // lightweight-charts 요구사항: { time: number(초), open, high, low, close }[] (오름차순 정렬)
  function generateCandleData(prices: number[], timeframe: string, baseTime: number): CandleData[] {
    if (prices.length < 4) return []
    
    const candles: CandleData[] = []
    let candleSize = 1 // 기본: 1개 데이터포인트당 1개 캔들
    
    // 시간대에 따라 캔들 크기 조정
    switch (timeframe) {
      case "1H":
        candleSize = Math.max(1, Math.floor(prices.length / 12)) // 12개 캔들
        break
      case "1D":
        candleSize = Math.max(1, Math.floor(prices.length / 24)) // 24개 캔들
        break
      case "1W":
        candleSize = Math.max(1, Math.floor(prices.length / 7)) // 7개 캔들
        break
      case "1M":
        candleSize = Math.max(1, Math.floor(prices.length / 30)) // 30개 캔들
        break
      case "1Y":
        candleSize = Math.max(1, Math.floor(prices.length / 12)) // 12개 캔들
        break
    }
    
    // 캔들 데이터 생성 (과거부터 현재까지)
    for (let i = 0; i < prices.length; i += candleSize) {
      const chunk = prices.slice(i, Math.min(i + candleSize, prices.length))
      if (chunk.length === 0) continue
      
      // ✅ 문자열을 숫자로 변환하고 NaN 필터링
      const chunkNums = chunk
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0)
      
      if (!chunkNums.length) continue
      
      const open = Number(chunkNums[0])
      const close = Number(chunkNums[chunkNums.length - 1])
      const high = Number(Math.max(...chunkNums))
      const low = Number(Math.min(...chunkNums))
      
      // time은 초 단위 Unix timestamp (오름차순)
      // 과거부터 현재까지: baseTime - (전체 데이터 수 - 현재 인덱스) * 60초
      const secondsAgo = (prices.length - 1 - i) * 60 // 1분 간격
      const time = baseTime - secondsAgo
      
      // timestamp는 밀리초로 저장 (나중에 변환용)
      candles.push({ timestamp: time * 1000, open, high, low, close })
    }
    
    // 오름차순 정렬 (time 기준)
    candles.sort((a, b) => a.timestamp - b.timestamp)
    
    return candles
  }
  
  // TradingView lightweight-charts용 데이터 변환
  // 공식 문서: https://tradingview.github.io/lightweight-charts/docs/series-types#candlestick
  // 요구사항: { time: number(초), open, high, low, close }[] (오름차순 정렬)
  const tradingViewCandleData: CandleDataPoint[] = useMemo(() => {
    if (!candleData || candleData.length === 0) {
      console.log("🕯️ 캔들 데이터 없음");
      return []
    }
    
    // timestamp(밀리초)를 time(초)로 변환
    // ✅ 모든 값을 Number()로 변환하고 NaN 필터링
    const mappedData = candleData
      .map(candle => {
        const time = Math.floor(candle.timestamp / 1000) // Unix timestamp (seconds) - number 타입
        const open = Number(candle.open)
        const high = Number(candle.high)
        const low = Number(candle.low)
        const close = Number(candle.close)
        
        // NaN 체크
        if (!Number.isFinite(time) || !Number.isFinite(open) || !Number.isFinite(high) || 
            !Number.isFinite(low) || !Number.isFinite(close)) {
          return null
        }
        
        return { time, open, high, low, close }
      })
      .filter((d): d is CandleDataPoint => d !== null)
    
    // 오름차순 정렬 (time 기준)
    mappedData.sort((a, b) => a.time - b.time)
    
    // 중복 time 제거 (같은 time이 있으면 첫 번째 것만 유지)
    const uniqueData = mappedData.reduce((acc, curr) => {
      const last = acc[acc.length - 1]
      if (!last || last.time !== curr.time) {
        acc.push(curr)
      }
      return acc
    }, [] as CandleDataPoint[])
    
    // 데이터 유효성 검증
    const validData = uniqueData.filter((d: CandleDataPoint) => 
      d.time > 0 && 
      d.open > 0 && 
      d.high > 0 && 
      d.low > 0 && 
      d.close > 0 &&
      d.high >= d.low &&
      d.high >= d.open &&
      d.high >= d.close &&
      d.low <= d.open &&
      d.low <= d.close
    );
    
    console.log("🕯️ 캔들 데이터 변환:", {
      원본: candleData.length,
      변환: mappedData.length,
      유효: validData.length,
      샘플: validData.slice(0, 3),
      최소time: validData[0]?.time,
      최대time: validData[validData.length - 1]?.time
    });
    
    return validData;
  }, [candleData])
  
  // lightweight-charts 요구사항: { time: number(초), value: number }[] (오름차순 정렬)
  // 마지막 포인트를 현재 가격으로 업데이트하여 부드러운 전환
  const tradingViewLineData: LineDataPoint[] = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return []
    }
    
    // 현재 시각 (초 단위 Unix timestamp)
    const now = Math.floor(Date.now() / 1000)
    
    // ✅ 각 가격을 숫자로 변환하고 NaN 필터링
    const dataPoints = chartData
      .map((price, index) => {
        const v = Number(price)
        if (!Number.isFinite(v) || v <= 0) return null
        
        // 데이터 포인트 수만큼 과거로 거슬러 올라가며 타임스탬프 생성
        const secondsAgo = (chartData.length - 1 - index) * 60 // 1분 간격
        const time = now - secondsAgo
        return { time, value: v }
      })
      .filter((d): d is LineDataPoint => d !== null)
    
    // 오름차순 정렬 (time 기준)
    dataPoints.sort((a, b) => a.time - b.time)
    
    // 중복 time 제거 (같은 time이 있으면 첫 번째 것만 유지)
    const uniqueDataPoints = dataPoints.reduce((acc, curr) => {
      const last = acc[acc.length - 1]
      if (!last || last.time !== curr.time) {
        acc.push(curr)
      }
      return acc
    }, [] as LineDataPoint[])
    
    // 마지막 포인트를 현재 가격으로 업데이트 (부드러운 전환을 위해)
    if (uniqueDataPoints.length > 0 && coin.price > 0) {
      const lastPoint = uniqueDataPoints[uniqueDataPoints.length - 1]
      // 마지막 포인트의 시간은 현재 시간으로 유지
      lastPoint.time = now
      lastPoint.value = coin.price
    }
    
    return uniqueDataPoints
  }, [chartData, coin.price]) // coin.price 추가하여 가격 변경 시 마지막 포인트만 업데이트
  
  // 차트 너비 반응형 조정
  useEffect(() => {
    const updateChartWidth = () => {
      if (typeof window !== 'undefined') {
        const container = document.querySelector('.chart-container')
        if (container) {
          setChartWidth(container.clientWidth)
        } else {
          setChartWidth(Math.min(window.innerWidth - 100, 1200))
        }
      }
    }
    
    updateChartWidth()
    window.addEventListener('resize', updateChartWidth)
    
    return () => window.removeEventListener('resize', updateChartWidth)
  }, [])

  // 보유량 조회 함수
  const fetchHolding = async () => {
    try {
      setLoadingHolding(true)
      const response = await fetch(`/api/user/holdings?coinId=${coin.id}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.amount > 0) {
          setHolding({
            amount: result.data.amount,
            averageBuyPrice: result.data.averageBuyPrice,
          })
        } else {
          setHolding(null)
        }
      }
    } catch (error) {
      console.error("Failed to fetch holding:", error)
      setHolding(null)
    } finally {
      setLoadingHolding(false)
    }
  }

  // 보유량 조회
  useEffect(() => {
    if (!loading && coin.id) {
      fetchHolding()
    }
  }, [coin.id, loading])

  // 구매 금액(원화) 변경 시 코인 수량 계산
  useEffect(() => {
    if (buyAmountKRW && coin.price > 0) {
      const krwAmount = parseFloat(buyAmountKRW) || 0
      const coinAmount = krwAmount / coin.price
      setBuyAmount(coinAmount.toFixed(8))
    } else {
      setBuyAmount("0")
    }
  }, [buyAmountKRW, coin.price])

  // 판매 코인 수량 변경 시 원화 금액 계산
  useEffect(() => {
    if (sellAmount && coin.price > 0) {
      const coinAmount = parseFloat(sellAmount) || 0
      const krwAmount = coinAmount * coin.price
      setSellAmountKRW(krwAmount.toFixed(0))
    } else {
      setSellAmountKRW("0")
    }
  }, [sellAmount, coin.price])

  // 구매 함수 (OrderTicketSheet에서도 사용 가능하도록)
  const handleBuy = async (amountKRW?: number) => {
    const krwAmount = amountKRW || parseFloat(buyAmountKRW) || 0
    if (krwAmount <= 0) {
      alert("구매 금액을 입력해주세요.")
      return
    }

    if (coin.price <= 0) {
      alert("가격 정보를 불러올 수 없습니다.")
      return
    }

    setTrading(true)
    try {
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "buy",
          coinId: coin.id,
          coinName: coin.name,
          coinSymbol: coin.symbol,
          amount: krwAmount, // 원화 금액
          price: coin.price,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "구매에 실패했습니다.")
      }

      const result = await response.json()
      if (result.success) {
        alert(
          `${coin.symbol} ${result.data.coinAmount.toFixed(8)}개 구매 완료!\n` +
          `총 금액: ₩${krwAmount.toLocaleString()}`
        )
        
        // 보유량 업데이트
        setHolding({
          amount: result.data.holdings.amount,
          averageBuyPrice: result.data.holdings.averagePrice,
        })
        
        // 입력 초기화
        setBuyAmountKRW("0")
        setBuyAmount("0")
        
        // 보유량 다시 로드
        await fetchHolding()
        
        // 거래 내역 다시 로드
        await fetchTransactions()
        
        // 대시보드 업데이트를 위한 이벤트 발생 (부드러운 업데이트)
        window.dispatchEvent(new CustomEvent('tradeCompleted'))
      }
    } catch (error: any) {
      alert(error.message || "구매에 실패했습니다.")
      throw error
    } finally {
      setTrading(false)
    }
  }

  // 판매 함수 (OrderTicketSheet에서도 사용 가능하도록)
  const handleSell = async (coinAmount?: number) => {
    const sellCoinAmount = coinAmount || parseFloat(sellAmount) || 0
    if (sellCoinAmount <= 0) {
      alert("판매 수량을 입력해주세요.")
      return
    }

    if (!holding || holding.amount < sellCoinAmount) {
      alert(`보유량이 부족합니다. (보유: ${holding?.amount.toFixed(8) || 0})`)
      return
    }

    if (coin.price <= 0) {
      alert("가격 정보를 불러올 수 없습니다.")
      return
    }

    setTrading(true)
    try {
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "sell",
          coinId: coin.id,
          coinName: coin.name,
          coinSymbol: coin.symbol,
          amount: sellCoinAmount, // 코인 수량
          price: coin.price,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "판매에 실패했습니다.")
      }

      const result = await response.json()
      if (result.success) {
        alert(
          `${coin.symbol} ${sellCoinAmount.toFixed(8)}개 판매 완료!\n` +
          `총 금액: ₩${result.data.totalValue.toLocaleString()}`
        )
        
        // 보유량 업데이트
        if (result.data.remainingHolding > 0) {
          setHolding({
            amount: result.data.remainingHolding,
            averageBuyPrice: holding.averageBuyPrice, // 평균 매가는 유지
          })
        } else {
          setHolding(null)
        }
        
        // 입력 초기화
        setSellAmount("0")
        setSellAmountKRW("0")
        
        // 보유량 다시 로드
        await fetchHolding()
        
        // 거래 내역 다시 로드
        await fetchTransactions()
        
        // 대시보드 업데이트를 위한 이벤트 발생 (부드러운 업데이트)
        window.dispatchEvent(new CustomEvent('tradeCompleted'))
      }
    } catch (error: any) {
      alert(error.message || "판매에 실패했습니다.")
      throw error
    } finally {
      setTrading(false)
    }
  }

  // WebSocket을 통한 실시간 가격 업데이트 (초기 데이터도 WebSocket에서 받음)
  useEffect(() => {
    // WebSocket 연결 시작 (coin이 없어도 연결하여 initial 메시지에서 데이터 받음)
    const wsUrl = getWebSocketUrl()
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log("✅ 코인 상세 페이지 WebSocket 연결 성공")
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        if (message.type === "initial") {
          // 초기 데이터 수신 (WebSocket에서 모든 코인 데이터를 받음)
          const initialCoin = message.data.find(
            (c: any) => c.symbol?.toUpperCase() === symbol.toUpperCase()
          )
          
          if (initialCoin) {
            // 초기 코인 데이터 설정
            const coinData: CoinData = {
              id: initialCoin.coinId || symbol.toLowerCase(),
              name: initialCoin.name || symbol.toUpperCase(),
              symbol: initialCoin.symbol?.toUpperCase() || symbol.toUpperCase(),
              price: initialCoin.price,
              change1h: initialCoin.change1h || 0,
              change24h: initialCoin.change24h || 0,
              change1w: initialCoin.change1w || 0,
              change24hValue: parseFloat((initialCoin.change24h * initialCoin.price / 100).toFixed(2)),
              tvl: 0, // WebSocket에서 받지 않으므로 나중에 API에서 가져올 수 있음
              marketCap: 0,
              fdv: 0,
              volume24h: 0,
              description: `${initialCoin.name || symbol} is a cryptocurrency...`,
            }
            
            setCoin(coinData)
            setLoading(false)
            // 통계는 별도 useEffect에서 API로 가져옴
          } else {
            // 초기 데이터에서 코인을 찾지 못한 경우
            console.warn(`⚠️ WebSocket에서 코인 ${symbol}을 찾을 수 없음`)
            setCoin(getFallbackCoinData(symbol))
            setLoading(false)
          }
        } else if (message.type === "update") {
          // 가격 업데이트 수신
          const update = message.data.find(
            (u: any) => u.symbol?.toUpperCase() === symbol.toUpperCase()
          )
          
          if (update) {
            setCoin((prev) => {
              if (!prev) return prev
              return {
                ...prev,
                price: update.price,
                change1h: update.change1h,
                change24h: update.change24h,
                change1w: update.change1w,
                change24hValue: parseFloat((update.change24h * update.price / 100).toFixed(2)),
              }
            })
          }
        }
      } catch (error) {
        console.error("WebSocket 메시지 파싱 오류:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket 에러:", error)
      // 에러 시 폴백 데이터 사용
      setCoin(getFallbackCoinData(symbol))
      setLoading(false)
    }

    ws.onclose = () => {
      console.log("WebSocket 연결 종료")
    }

    return () => {
      ws.close()
    }
  }, [symbol])

  // 거래 내역 조회 함수
  const fetchTransactions = async () => {
    if (loading) return
    
    try {
      setTransactionsLoading(true)
      const response = await fetch(`/api/coins/${symbol}/transactions?limit=20`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setTransactions(result.data)
        } else {
          setTransactions([])
        }
      } else {
        setTransactions([])
      }
    } catch (error) {
      console.error("Failed to load transactions:", error)
      setTransactions([])
    } finally {
      setTransactionsLoading(false)
    }
  }

  // 거래 내역 로드
  useEffect(() => {
    fetchTransactions()
  }, [symbol, loading])

  // 날짜 포맷팅 함수
  const formatTransactionTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "방금 전"
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`

    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">로딩 중...</p>
          </div>
        </div>
      </main>
    )
  }

  const isPositive = coin.change24h >= 0


  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* 브레드크럼 및 헤더 */}
        <div className="mb-4 lg:mb-6">
          <div className="flex items-center gap-3 mb-3 lg:mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white hover:bg-primary/10 min-w-[44px] min-h-[44px]"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-1 text-sm text-gray-400">
              <Link href="/dashboard/trading" className="hover:text-white transition-colors flex items-center">
                탐색
              </Link>
              <span className="flex items-center">/</span>
              <span className="flex items-center">토큰</span>
              <span className="flex items-center">/</span>
              <span className="text-white flex items-center">{coin.symbol}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-lg sm:text-xl font-bold text-primary">{coin.symbol[0]}</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{coin.name}</h1>
                <p className="text-gray-400 text-sm">{coin.symbol}</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-primary/10 min-w-[44px] min-h-[44px]">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* 왼쪽 컬럼 (차트, 통계, 트랜잭션 풀) */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* 가격 및 차트 */}
            <Card className="bg-transparent border-primary/20">
              <CardContent className="p-6">
                <div className="mb-6">
                  <p className="text-4xl font-bold text-white mb-2">
                    {coin.price < 1 
                      ? `₩${coin.price.toFixed(8).replace(/\.?0+$/, '')}`
                      : coin.price < 1000
                      ? `₩${coin.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                      : `₩${coin.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    }
                  </p>
                  <div className={cn("flex items-center gap-2", isPositive ? "text-green-400" : "text-red-400")}>
                    {isPositive ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                    <span className="text-lg font-semibold">
                      {isPositive ? "+" : ""}₩{Math.abs(coin.change24hValue).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({coin.change24h.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* 차트 타입 스위치 */}
                <div className="mb-4 flex items-center gap-2">
                  <button
                    onClick={() => setChartType("line")}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      chartType === "line"
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-gray-400 hover:text-white hover:bg-primary/10"
                    )}
                  >
                    라인
                  </button>
                  <button
                    onClick={() => setChartType("candlestick")}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      chartType === "candlestick"
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-gray-400 hover:text-white hover:bg-primary/10"
                    )}
                  >
                    캔들
                  </button>
                </div>

                {/* 차트 영역 */}
                <div className="relative h-80 sm:h-[320px] mb-4 overflow-hidden chart-container">
                  {chartLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">차트 로딩 중...</p>
                    </div>
                  ) : chartType === "line" && tradingViewLineData.length > 1 ? (
                    <div className="w-full h-full transition-all duration-500 ease-in-out" style={{ opacity: 1 }}>
                      <TradingViewChart
                        data={tradingViewLineData}
                        type="line"
                        width={chartWidth}
                        height={320}
                      />
                    </div>
                  ) : chartType === "candlestick" && tradingViewCandleData.length > 0 ? (
                    <div className="w-full h-full transition-all duration-500 ease-in-out" style={{ opacity: 1 }}>
                      <TradingViewChart
                        data={tradingViewCandleData}
                        type="candlestick"
                        width={chartWidth}
                        height={320}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">차트 데이터를 불러올 수 없습니다.</p>
                    </div>
                  )}
                </div>

                {/* 시간대 선택 버튼 */}
                <div className="flex items-center gap-2">
                  {(["1H", "1D", "1W", "1M", "1Y"] as const).map((tf) => (
                    <Button
                      key={tf}
                      variant={chartTimeframe === tf ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartTimeframe(tf)}
                      className={cn(
                        chartTimeframe === tf
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent border-primary/20 text-white hover:bg-primary/10"
                      )}
                    >
                      {tf}
                    </Button>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="bg-transparent border-primary/20 text-white">
                      가격
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 통계 */}
            <Card className="bg-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="text-white">통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">TVL</p>
                    <p className="text-xl font-semibold text-white">
                      {fixedStats && fixedStats.tvl >= 1_000_000_000_000
                        ? `₩${(fixedStats.tvl / 1_000_000_000_000).toFixed(2)}T`
                        : fixedStats && fixedStats.tvl >= 1_000_000_000
                        ? `₩${(fixedStats.tvl / 1_000_000_000).toFixed(2)}B`
                        : fixedStats && fixedStats.tvl >= 1_000_000
                        ? `₩${(fixedStats.tvl / 1_000_000).toFixed(2)}M`
                        : fixedStats
                        ? `₩${fixedStats.tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">시가총액</p>
                    <p className="text-xl font-semibold text-white">
                      {fixedStats && fixedStats.marketCap >= 1_000_000_000_000
                        ? `₩${(fixedStats.marketCap / 1_000_000_000_000).toFixed(2)}T`
                        : fixedStats && fixedStats.marketCap >= 1_000_000_000
                        ? `₩${(fixedStats.marketCap / 1_000_000_000).toFixed(2)}B`
                        : fixedStats && fixedStats.marketCap >= 1_000_000
                        ? `₩${(fixedStats.marketCap / 1_000_000).toFixed(2)}M`
                        : fixedStats
                        ? `₩${fixedStats.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">FDV</p>
                    <p className="text-xl font-semibold text-white">
                      {fixedStats && fixedStats.fdv >= 1_000_000_000_000
                        ? `₩${(fixedStats.fdv / 1_000_000_000_000).toFixed(2)}T`
                        : fixedStats && fixedStats.fdv >= 1_000_000_000
                        ? `₩${(fixedStats.fdv / 1_000_000_000).toFixed(2)}B`
                        : fixedStats && fixedStats.fdv >= 1_000_000
                        ? `₩${(fixedStats.fdv / 1_000_000).toFixed(2)}M`
                        : fixedStats
                        ? `₩${fixedStats.fdv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">1일 거래량</p>
                    <p className="text-xl font-semibold text-white">
                      {fixedStats && fixedStats.volume24h >= 1_000_000_000_000
                        ? `₩${(fixedStats.volume24h / 1_000_000_000_000).toFixed(2)}T`
                        : fixedStats && fixedStats.volume24h >= 1_000_000_000
                        ? `₩${(fixedStats.volume24h / 1_000_000_000).toFixed(2)}B`
                        : fixedStats && fixedStats.volume24h >= 1_000_000
                        ? `₩${(fixedStats.volume24h / 1_000_000).toFixed(2)}M`
                        : fixedStats
                        ? `₩${fixedStats.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 트랜잭션 풀 */}
            <Card className="bg-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="text-white">트랜잭션 풀</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-400">거래 내역을 불러오는 중...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-400">거래 내역이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              tx.type === "buy" ? "bg-green-400" : "bg-red-400"
                            )}
                          />
                          <div>
                            <p className="text-white font-medium">
                              {tx.type === "buy" ? "구매" : "판매"} {tx.amount < 1
                                ? tx.amount.toFixed(8).replace(/\.?0+$/, "")
                                : tx.amount.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  })} {coin.symbol}
                            </p>
                            <p className="text-sm text-gray-400">{formatTransactionTime(tx.createdAt)}</p>
                          </div>
                        </div>
                        <p className="text-white font-semibold">
                          {tx.price < 1
                            ? `₩${tx.price.toFixed(8).replace(/\.?0+$/, "")}`
                            : tx.price < 1000
                            ? `₩${tx.price.toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}`
                            : `₩${tx.price.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 컬럼 (거래 인터페이스, 정보) - 데스크톱만 */}
          <div className="hidden lg:block space-y-6">
            {/* 거래 인터페이스 */}
            <Card className="bg-transparent border-primary/20">
              <CardHeader>
                <div className="flex gap-2">
                  {(["buy", "sell"] as const).map((tab) => (
                    <Button
                      key={tab}
                      variant={activeTab === tab ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        activeTab === tab
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent text-white hover:bg-primary/10"
                      )}
                    >
                      {tab === "buy" && "구입하다"}
                      {tab === "sell" && "팔기"}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 구입하다 탭 */}
                {activeTab === "buy" && (
                  <>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">구매 금액 (원화)</p>
                      <div className="mb-4">
                        <Input
                          type="text"
                          value={buyAmountKRW ? parseFloat(buyAmountKRW || "0").toLocaleString("ko-KR") : ""}
                          onChange={(e) => {
                            // 숫자만 추출 (쉼표 제거)
                            const numericValue = e.target.value.replace(/[^\d]/g, "")
                            setBuyAmountKRW(numericValue || "0")
                          }}
                          placeholder="0"
                          className="w-full bg-black/40 border-primary/20 text-white text-3xl font-bold text-center py-6 tabular-nums"
                          inputMode="numeric"
                        />
                        <p className="text-sm text-gray-400 mt-2 text-center">
                          ≈ {parseFloat(buyAmount || "0").toFixed(8)} {coin.symbol}
                        </p>
                      </div>
                      
                      {/* 빠른 금액 선택 버튼 */}
                      <div className="flex gap-2 mb-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBuyAmountKRW((prev) => {
                            const current = parseFloat(prev || "0") || 0
                            const newValue = current + 1000000
                            return String(newValue)
                          })}
                          className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10 min-h-[44px]"
                        >
                          ₩100만
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBuyAmountKRW((prev) => {
                            const current = parseFloat(prev || "0") || 0
                            const newValue = current + 10000000
                            return String(newValue)
                          })}
                          className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10 min-h-[44px]"
                        >
                          ₩1000만
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBuyAmountKRW((prev) => {
                            const current = parseFloat(prev || "0") || 0
                            const newValue = current + 50000000
                            return String(newValue)
                          })}
                          className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10 min-h-[44px]"
                        >
                          ₩5000만
                        </Button>
                      </div>
                    </div>

                    {/* 코인 정보 */}
                    <div className="p-4 rounded-lg border border-primary/20 bg-black/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="text-lg font-bold text-primary">{coin.symbol[0]}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{coin.name}</p>
                            <p className="text-gray-400 text-sm">{coin.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">₩{coin.price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleBuy()}
                      disabled={trading || parseFloat(buyAmountKRW) <= 0}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 min-h-[44px]"
                    >
                      {trading ? "처리 중..." : "구매"}
                    </Button>
                  </>
                )}

                {/* 팔기 탭 */}
                {activeTab === "sell" && (
                  <>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">판매 수량 ({coin.symbol})</p>
                      {holding && (
                        <p className="text-xs text-gray-500 mb-2">
                          보유: {holding.amount.toFixed(8)} {coin.symbol}
                        </p>
                      )}
                      <div className="mb-4">
                        <Input
                          type="number"
                          value={sellAmount}
                          onChange={(e) => setSellAmount(e.target.value)}
                          placeholder="0"
                          className="w-full bg-black/40 border-primary/20 text-white text-3xl font-bold text-center py-6"
                          step="0.00000001"
                          min="0"
                          max={holding?.amount || 0}
                        />
                        <p className="text-sm text-gray-400 mt-2 text-center">
                          ≈ ₩{parseFloat(sellAmountKRW || "0").toLocaleString()}
                        </p>
                      </div>
                      
                      {/* 퍼센트 선택 버튼 */}
                      {holding && holding.amount > 0 && (
                        <div className="flex gap-2 mb-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const amount = (holding.amount * 0.25).toFixed(8)
                              setSellAmount(amount)
                            }}
                            className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10"
                          >
                            25%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const amount = (holding.amount * 0.5).toFixed(8)
                              setSellAmount(amount)
                            }}
                            className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10"
                          >
                            50%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const amount = (holding.amount * 0.75).toFixed(8)
                              setSellAmount(amount)
                            }}
                            className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10"
                          >
                            75%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSellAmount(holding.amount.toFixed(8))
                            }}
                            className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10"
                          >
                            최대
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* 코인 정보 */}
                    <div className="p-4 rounded-lg border border-primary/20 bg-black/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="text-lg font-bold text-primary">{coin.symbol[0]}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{coin.name}</p>
                            <p className="text-gray-400 text-sm">{coin.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">₩{coin.price.toLocaleString()}</p>
                          {holding && (
                            <p className="text-xs text-gray-400">
                              평균: ₩{holding.averageBuyPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {!holding || holding.amount === 0 ? (
                      <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10">
                        <p className="text-sm text-red-400 text-center">
                          보유한 {coin.symbol}가 없습니다.
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleSell()}
                        disabled={trading || parseFloat(sellAmount) <= 0 || parseFloat(sellAmount) > holding.amount}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 min-h-[44px]"
                      >
                        {trading ? "처리 중..." : "판매"}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* 정보 섹션 */}
            <Card className="bg-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="text-white">정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-transparent border-primary/20 text-white hover:bg-primary/10">
                    이더스캔
                  </Button>
                  <Button variant="outline" size="sm" className="bg-transparent border-primary/20 text-white hover:bg-primary/10">
                    웹사이트
                  </Button>
                  <Button variant="outline" size="sm" className="bg-transparent border-primary/20 text-white hover:bg-primary/10">
                    X 트위터
                  </Button>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{coin.description}</p>
                <Button variant="ghost" className="text-primary hover:text-primary/80 p-0 h-auto">
                  자세히보기
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 모바일 거래 버튼 */}
          <div className="lg:hidden fixed bottom-20 right-4 z-20">
            <Button
              onClick={() => setOrderSheetOpen(true)}
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg min-w-[44px] min-h-[44px]"
              aria-label="거래하기"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* 모바일 주문 티켓 시트 */}
          <OrderTicketSheet
            isOpen={orderSheetOpen}
            onClose={() => setOrderSheetOpen(false)}
            coin={coin}
            onBuy={handleBuy}
            onSell={handleSell}
            holding={holding}
          />
        </div>
      </div>
    </main>
  )
}

