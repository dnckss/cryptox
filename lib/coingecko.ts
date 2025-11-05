/**
 * CoinGecko API 유틸리티
 * 무료 계정 제한: 월간 10,000회, 분당 30회
 * 최적화: 캐싱 및 배치 요청 활용
 */

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3"
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY

// 캐시 설정 (Next.js fetch 캐싱 활용)
const CACHE_REVALIDATE = 60 // 60초 (1분) - 가격 데이터는 자주 변경되므로 짧게 설정

interface CoinGeckoPrice {
  [coinId: string]: {
    usd?: number
    krw?: number
    usd_24h_change?: number
    usd_market_cap?: number
    usd_24h_vol?: number
  }
}

interface CoinGeckoMarket {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number
  total_volume: number
  price_change_percentage_1h_in_currency?: number
  price_change_percentage_24h_in_currency?: number
  price_change_percentage_7d_in_currency?: number
  sparkline_in_7d?: {
    price: number[]
  }
}

/**
 * 코인 심볼을 CoinGecko ID로 매핑
 * 주요 코인만 미리 정의하여 API 호출 최적화
 */
const COIN_ID_MAP: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  ada: "cardano",
  matic: "matic-network",
  dot: "polkadot",
  avax: "avalanche-2",
  link: "chainlink",
  uni: "uniswap",
  atom: "cosmos",
  near: "near",
  algo: "algorand",
  xtz: "tezos",
  fil: "filecoin",
  icp: "internet-computer",
  apt: "aptos",
  sui: "sui",
  arb: "arbitrum",
  op: "optimism",
  mana: "decentraland",
  sand: "the-sandbox",
  axs: "axie-infinity",
  enj: "enjincoin",
  chz: "chiliz",
  flow: "flow",
  theta: "theta-token",
  eos: "eos",
  trx: "tron",
  xrp: "ripple",
  doge: "dogecoin",
  shib: "shiba-inu",
  pepe: "pepe",
  floki: "floki",
  wif: "dogwifcoin",
  bonk: "bonk",
  lunc: "terra-luna",
  luna: "terra-luna-2",
  bnb: "binancecoin",
  ftm: "fantom",
  one: "harmony",
  rose: "oasis-network",
  celo: "celo",
  klay: "klay-token",
  waves: "waves",
  zil: "zilliqa",
  vet: "vechain",
  hbar: "hedera-hashgraph",
  iota: "iota",
  nano: "nano",
  xlm: "stellar",
  xmr: "monero",
  zec: "zcash",
  dash: "dash",
  ltc: "litecoin",
  bch: "bitcoin-cash",
  bsv: "bitcoin-sv",
  etc: "ethereum-classic",
  usdt: "tether",
  usdc: "usd-coin",
  dai: "dai",
  busd: "binance-usd",
}

/**
 * 여러 코인의 가격을 한 번에 가져오기 (최적화된 엔드포인트)
 * @param coinIds CoinGecko ID 배열 (예: ['bitcoin', 'ethereum'])
 * @returns 가격 데이터
 */
export async function getCoinPrices(
  coinIds: string[]
): Promise<CoinGeckoPrice> {
  if (coinIds.length === 0) return {}

  try {
    const ids = coinIds.join(",")
    // include_24hr_vol과 include_market_cap은 실제로는 /simple/price에서 지원되지 않을 수 있음
    // 대신 /coins/markets를 사용하거나 별도로 호출해야 함
    const url = `${COINGECKO_API_BASE}/simple/price?ids=${ids}&vs_currencies=usd,krw&include_24hr_change=true`
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    
    // API 키가 있으면 헤더에 추가
    if (COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = COINGECKO_API_KEY
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: CACHE_REVALIDATE }, // Next.js 캐싱
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`CoinGecko API error: ${response.status}`, errorText)
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching coin prices:", error)
    return {}
  }
}

/**
 * 시장 데이터 가져오기 (거래량, 시가총액 등 포함)
 * @param page 페이지 번호 (1부터 시작)
 * @param perPage 페이지당 항목 수 (최대 250)
 * @returns 시장 데이터 배열
 */
export async function getCoinMarkets(
  page: number = 1,
  perPage: number = 100
): Promise<CoinGeckoMarket[]> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${Math.min(perPage, 250)}&page=${page}&sparkline=false&price_change_percentage=1h,24h,7d`
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    
    if (COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = COINGECKO_API_KEY
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: CACHE_REVALIDATE },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching coin markets:", error)
    return []
  }
}

/**
 * 특정 코인의 상세 정보 가져오기
 * @param coinId CoinGecko ID (예: 'bitcoin')
 * @returns 코인 상세 정보
 */
export async function getCoinDetail(coinId: string): Promise<any> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    
    if (COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = COINGECKO_API_KEY
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: CACHE_REVALIDATE },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching coin detail:", error)
    return null
  }
}

/**
 * 차트 데이터 가져오기 (과거 가격 데이터)
 * @param coinId CoinGecko ID (예: 'bitcoin')
 * @param days 기간 (1, 7, 14, 30, 90, 180, 365, max)
 * @returns 차트 데이터 (prices 배열: [[timestamp, price], ...])
 */
export async function getCoinChartData(
  coinId: string,
  days: number | "max" = 1
): Promise<number[][]> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    
    if (COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = COINGECKO_API_KEY
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: CACHE_REVALIDATE },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    // prices 배열 반환: [[timestamp, price], ...]
    return data.prices || []
  } catch (error) {
    console.error("Error fetching coin chart data:", error)
    return []
  }
}

/**
 * 심볼을 CoinGecko ID로 변환
 * 매핑에 없으면 심볼을 소문자로 변환하여 시도 (많은 코인이 심볼과 ID가 동일함)
 */
export function symbolToCoinId(symbol: string): string | null {
  const lowerSymbol = symbol.toLowerCase()
  // 먼저 매핑에서 찾기
  if (COIN_ID_MAP[lowerSymbol]) {
    return COIN_ID_MAP[lowerSymbol]
  }
  // 매핑에 없으면 심볼을 그대로 사용 (많은 코인이 심볼과 ID가 동일함)
  // 예: "usdt" -> "usdt" (하지만 실제로는 "tether"이므로 매핑에 추가해야 함)
  return lowerSymbol
}

/**
 * CoinGecko ID를 심볼로 변환 (역매핑)
 */
export function coinIdToSymbol(coinId: string): string | null {
  const entry = Object.entries(COIN_ID_MAP).find(
    ([_, id]) => id === coinId
  )
  return entry ? entry[0].toUpperCase() : null
}

