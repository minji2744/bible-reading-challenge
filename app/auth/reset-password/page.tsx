"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function ResetPasswordPage() {
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    if (!userId.trim()) {
      setError("ID를 입력해주세요")
      setIsLoading(false)
      return
    }

    if (!password.trim()) {
      setError("비밀번호를 입력해주세요")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId.trim(),
          newPassword: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "비밀번호 재설정에 실패했습니다")
      }

      setSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-amber-900">비밀번호 재설정</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col gap-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-green-600">
                    비밀번호가 성공적으로 변경되었습니다.
                  </p>
                  <p className="text-sm text-gray-600">
                    로그인 페이지로 이동합니다...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="userId">ID</Label>
                    <Input
                      id="userId"
                      type="text"
                      placeholder="ID를 입력하세요"
                      required
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">새 비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="새 비밀번호를 입력하세요"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="비밀번호를 다시 입력하세요"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
                    {isLoading ? "변경 중..." : "비밀번호 변경"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <Link href="/auth/login" className="underline underline-offset-4 text-amber-700 hover:text-amber-900">
                    로그인 페이지로 돌아가기
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

