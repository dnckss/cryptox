import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/utils/admin"
import { isPriceFluctuationPaused } from "@/lib/mock-coins-service"

/**
 * GET /api/admin/coins/[symbol]/pause-status
 * 관리자 - 코인 자동 변동 중단 상태 확인
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    // 관리자 권한 체크
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { symbol } = await params
    const paused = isPriceFluctuationPaused(symbol.toLowerCase())

    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        paused,
      },
    })
  } catch (error) {
    console.error("Error in GET /api/admin/coins/[symbol]/pause-status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

