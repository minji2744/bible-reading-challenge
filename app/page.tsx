import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-amber-100 p-6">
            <BookOpen className="h-16 w-16 text-amber-600" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-amber-900 text-balance">성경 읽기 챌린지</h1>
        <p className="text-xl text-amber-700 text-balance">
          매일 성경을 읽고 기록하세요!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700">
            <Link href="/auth/sign-up">가입하기</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-amber-600 text-amber-700 hover:bg-amber-50 bg-transparent"
          >
            <Link href="/auth/login">로그인</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
