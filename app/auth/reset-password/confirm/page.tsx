"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"

function ConfirmResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Supabase password reset uses hash fragments in the URL
    // The client will automatically process these when the page loads
    const supabase = createClient()
    
    // Check if we have hash fragments (Supabase password reset tokens)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get("access_token")
    const type = hashParams.get("type")
    
    if (type === "recovery" && accessToken) {
      // Supabase client will automatically handle the session from hash fragments
      // We just need to verify the session is established
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error || !session) {
          setError("유효하지 않은 링크입니다. 링크가 만료되었거나 이미 사용되었을 수 있습니다.")
        }
      })
    } else {
      // Check for query params as fallback (some email clients might convert hash to query)
      const code = searchParams.get("code")
      const typeParam = searchParams.get("type")
      if (!code || typeParam !== "recovery") {
        setError("유효하지 않은 링크입니다")
      }
    }
  }, [searchParams])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

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
      // Verify session exists (user should be authenticated via the reset link)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error("세션이 만료되었습니다. 비밀번호 재설정 링크를 다시 요청해주세요.")
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw new Error(updateError.message || "비밀번호 업데이트에 실패했습니다")
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
            <CardTitle className="text-3xl font-bold text-amber-900">새 비밀번호 설정</CardTitle>
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
              <form onSubmit={handleUpdatePassword}>
                <div className="flex flex-col gap-6">
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
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ConfirmResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-amber-900">새 비밀번호 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-gray-600">로딩 중...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <ConfirmResetPasswordForm />
    </Suspense>
  )
}

