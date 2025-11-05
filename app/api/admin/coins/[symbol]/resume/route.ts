import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/utils/admin"
import { resumePriceFluctuation } from "@/lib/mock-coins-service"

/**
 * POST /api/admin/coins/[symbol]/resume
 * 관리자 - 코인 자동 변동 재개
 */
export async function POST(
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
    const success = resumePriceFluctuation(symbol.toLowerCase())

    if (!success) {
      return NextResponse.json({ error: "Failed to resume price fluctuation" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        paused: false,
      },
    })
  } catch (error) {
    console.error("Error in POST /api/admin/coins/[symbol]/resume:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

