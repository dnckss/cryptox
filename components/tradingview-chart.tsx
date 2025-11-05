"use client";

import React, { useEffect, useRef, memo } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts";

export interface CandleDataPoint {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LineDataPoint {
  time: number; // Unix seconds
  value: number;
}

interface TradingViewChartProps {
  data: CandleDataPoint[] | LineDataPoint[];
  type: "candlestick" | "line";
  width?: number;
  height?: number;
}

// 타입 가드
function isCandleArray(arr: any[]): arr is CandleDataPoint[] {
  return (
    Array.isArray(arr) &&
    arr.length > 0 &&
    "open" in arr[0] &&
    "high" in arr[0] &&
    "low" in arr[0] &&
    "close" in arr[0]
  );
}

function isLineArray(arr: any[]): arr is LineDataPoint[] {
  return Array.isArray(arr) && arr.length > 0 && "value" in arr[0];
}

export const TradingViewChart = memo(function TradingViewChart({
  data,
  type,
  width = 800,
  height = 400,
}: TradingViewChartProps) {
  // 모바일에서 높이를 320px로 고정
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024
  const chartHeight = isMobile ? 320 : height
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);

  // 차트/시리즈 생성·해제
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const rect = el.getBoundingClientRect();
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    const finalHeight = isMobile ? 320 : height;
    const cw = Math.max(rect.width || el.clientWidth || width, 1);
    const ch = Math.max(rect.height || el.clientHeight || finalHeight, 1);

    // 차트 생성
    const chart = createChart(el, {
      width: cw,
      height: ch,
      layout: {
        textColor: "rgba(255,255,255,0.85)",
        background: { type: ColorType.Solid, color: "black" },
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.08)" },
        horzLines: { color: "rgba(255,255,255,0.08)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.24)" },
      timeScale: {
        borderColor: "rgba(255,255,255,0.24)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(139,92,246,0.9)",
          width: 1,
          style: LineStyle.Solid,
        },
        horzLine: {
          color: "rgba(139,92,246,0.9)",
          width: 1,
          style: LineStyle.Solid,
        },
      },
    });

    chartRef.current = chart;

    // 시리즈 추가
    if (type === "candlestick") {
      seriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: "#10b981",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      });
    } else {
      seriesRef.current = chart.addSeries(LineSeries, {
        lineWidth: 2,
        color: "rgb(139, 92, 246)",
      });
    }

    // 반응형 처리
    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      if (newWidth > 0) {
        chartRef.current.applyOptions({ width: newWidth });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(el);

    // 클린업
    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
    };
  }, [type, width, height, chartHeight]);

  // 데이터 반영 (디바운스 적용, 모바일에서는 캔들 수 제한)
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    if (!Array.isArray(data) || data.length === 0) return;

    const updateChart = () => {
    try {
        const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
        
      if (isCandleArray(data)) {
          let sanitized = data
          .map((d) => ({
              time: Number(d.time) || Math.floor(Date.now() / 1000),
            open: Number(d.open),
            high: Number(d.high),
            low: Number(d.low),
            close: Number(d.close),
          }))
          .filter(
            (d) =>
              Number.isFinite(d.time) &&
              d.time > 0 &&
              [d.open, d.high, d.low, d.close].every(Number.isFinite)
          )
          .sort((a, b) => a.time - b.time);

          // 모바일에서는 최대 300개만 표시
          if (isMobile && sanitized.length > 300) {
            sanitized = sanitized.slice(-300);
          }

          seriesRef.current?.setData(sanitized);
      } else if (isLineArray(data)) {
          let sanitized = data
          .map((d) => ({
              time: Number(d.time) || Math.floor(Date.now() / 1000),
            value: Number(d.value),
          }))
          .filter(
            (d) =>
              Number.isFinite(d.time) &&
              d.time > 0 &&
              Number.isFinite(d.value)
          )
          .sort((a, b) => a.time - b.time);

          // 모바일에서는 최대 300개만 표시
          if (isMobile && sanitized.length > 300) {
            sanitized = sanitized.slice(-300);
          }

          seriesRef.current?.setData(sanitized);
      }

        chartRef.current?.timeScale().fitContent();
    } catch (e) {
      console.error("❌ series.setData 실패:", e);
    }
    };

    // 모바일에서는 300ms 디바운스 적용
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    const timeoutId = isMobile
      ? setTimeout(updateChart, 300)
      : setTimeout(updateChart, 0);

    return () => clearTimeout(timeoutId);
  }, [data]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: `${chartHeight}px`,
        minHeight: `${chartHeight}px`,
      }}
    />
  );
});

// 현재 시간 기반 데이터 생성 헬퍼 함수
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// 사용 예시
export function generateSampleData(): CandleDataPoint[] {
  const now = getCurrentTimestamp();
  return Array.from({ length: 100 }, (_, i) => {
    const basePrice = 100;
    return {
      time: now - (99 - i) * 60, // 1분 간격
      open: basePrice + Math.random() * 10,
      high: basePrice + Math.random() * 15,
      low: basePrice - Math.random() * 5,
      close: basePrice + Math.random() * 10,
    };
  });
}
