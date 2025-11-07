/**
 * Google Analytics 유틸리티
 */

export const GA_TRACKING_ID = "G-LCGB8H13K7"

// gtag 함수 타입 정의
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date,
      config?: Record<string, any>
    ) => void
    dataLayer: any[]
  }
}

/**
 * 페이지뷰 추적
 */
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

/**
 * 이벤트 추적
 */
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

/**
 * 로그인 이벤트 추적
 */
export const trackLogin = (method: string = "email") => {
  event({
    action: "login",
    category: "engagement",
    label: method,
  })
}

/**
 * 거래 이벤트 추적
 */
export const trackTrade = (
  type: "buy" | "sell",
  coinSymbol: string,
  amount: number,
  price: number
) => {
  event({
    action: type === "buy" ? "purchase" : "sell",
    category: "commerce",
    label: coinSymbol,
    value: amount * price,
  })
}

/**
 * 충전 이벤트 추적
 */
export const trackCharge = (amount: number) => {
  event({
    action: "charge",
    category: "commerce",
    label: "wallet_charge",
    value: amount,
  })
}

/**
 * 코인 상세 페이지뷰 추적
 */
export const trackCoinDetail = (coinSymbol: string) => {
  event({
    action: "view_item",
    category: "engagement",
    label: coinSymbol,
  })
}

/**
 * 검색 이벤트 추적
 */
export const trackSearch = (searchTerm: string) => {
  event({
    action: "search",
    category: "engagement",
    label: searchTerm,
  })
}

