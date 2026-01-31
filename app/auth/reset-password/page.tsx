"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"

export default function ResetPasswordPage() {
  const [userId, setUserId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    if (!userId.trim()) {
      setError("ID를 입력해주세요")
      setIsLoading(false)
      return
    }

    try {
      // Verify user exists with this ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", userId.trim())
        .single()

      if (profileError || !profile) {
        throw new Error("해당 ID로 등록된 사용자를 찾을 수 없습니다")
      }

      // Generate email identifier for Supabase auth
      const email = `${userId.trim().toLowerCase()}@challenge.local`

      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      })

      if (resetError) {
        throw new Error("비밀번호 재설정 이메일 전송에 실패했습니다")
      }

      setSuccess(true)
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
                    비밀번호 재설정 링크가 이메일로 전송되었습니다.
                  </p>
                  <p className="text-sm text-gray-600">
                    이메일을 확인하고 링크를 클릭하여 새 비밀번호를 설정해주세요.
                  </p>
                </div>
                <Link href="/auth/login">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">
                    로그인 페이지로 돌아가기
                  </Button>
                </Link>
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
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
                    {isLoading ? "전송 중..." : "재설정 링크 전송"}
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

