"use client";

import React, { useEffect, useRef, memo } from "react";

export interface CandleDataPoint {
  time: number; // Unix seconds 권장
  open: number;
  high: number;
  low: number;
  close: number;
}
export interface LineDataPoint {
  time: number; // Unix seconds 권장
  value: number;
}

interface TradingViewChartProps {
  data: CandleDataPoint[] | LineDataPoint[];
  type: "candlestick" | "line";
  width?: number;
  height?: number;
}

export const TradingViewChart = memo(function TradingViewChart({
  data,
  type,
  width = 800,
  height = 400,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const el = containerRef.current;
      if (!el) {
        return;
      }

      // ✅ 클라이언트 전용 동적 임포트 (SSR 경계 이슈 회피)
      const {
        createChart,
        CrosshairMode,
        LineStyle,
        CandlestickSeries,
        LineSeries,
      } = await import("lightweight-charts");

      const chart = createChart(el, {
        width,
        height,
        layout: {
          background: { color: "transparent" },
          textColor: "rgba(255,255,255,0.5)",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.05)" },
          horzLines: { color: "rgba(255,255,255,0.05)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "rgba(139,92,246,0.5)", width: 1, style: LineStyle.Solid },
          horzLine: { color: "rgba(139,92,246,0.5)", width: 1, style: LineStyle.Solid },
        },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.2)" },
        timeScale: { borderColor: "rgba(255,255,255,0.2)", timeVisible: true, secondsVisible: false },
      });

      chartRef.current = chart;

      if (!mounted) return;

      // ✅ v5 API: chart.addSeries(SeriesType, options)
      if (type === "candlestick") {
        const s = chart.addSeries(CandlestickSeries, {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        });
        seriesRef.current = s;
        if (Array.isArray(data) && data.length) {
          s.setData(data as any);
        }
      } else {
        const s = chart.addSeries(LineSeries, {
          color: "rgb(139, 92, 246)",
          lineWidth: 2,
        });
        seriesRef.current = s;
        if (Array.isArray(data) && data.length) {
          s.setData(data as any);
        }
      }

      chart.timeScale().fitContent();

      // 반응형: ResizeObserver
      const ro = new ResizeObserver(() => {
        if (!containerRef.current || !chartRef.current) return;
        const w = containerRef.current.clientWidth;
        if (w > 0) chartRef.current.applyOptions({ width: width ?? w });
      });
      ro.observe(el);
      roRef.current = ro;
    })();

    return () => {
      mounted = false;
      roRef.current?.disconnect();
      roRef.current = null;
      chartRef.current?.remove?.();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [type, width, height]);

  useEffect(() => {
    if (!seriesRef.current || !data?.length) return;
    seriesRef.current.setData(data as any);
    chartRef.current?.timeScale?.().fitContent?.();
  }, [data, type]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: `${height}px`, // 명시적 픽셀 높이
        minHeight: `${height}px`,
      }}
    />
  );
});