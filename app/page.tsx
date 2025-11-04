import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {/* 나중에 영상을 넣을 공간 */}
      <div className="flex flex-col items-center gap-4 z-10">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">cryptoX</h1>
        <Button asChild variant="outline" size="lg" className="text-lg bg-transparent px-8 py-6 border-primary text-primary hover:bg-primary/10">
          <Link href="/login">로그인</Link>
        </Button>
      </div>
    </div>
  )
}
