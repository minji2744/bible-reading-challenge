"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

const GROUP_NAMES = ["1조", "2조", "3조", "4조", "5조"]

export default function SignUpPage() {
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [groupName, setGroupName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!userId.trim()) {
      setError("ID를 입력해주세요")
      setIsLoading(false)
      return
    }

    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요")
      setIsLoading(false)
      return
    }

    if (!groupName.trim()) {
      setError("그룹명을 선택해주세요")
      setIsLoading(false)
      return
    }

    try {
      // Find or create the group
      let { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id")
        .eq("group_name", groupName.trim())
        .single()

      if (groupError || !group) {
        // Try to create the group if it doesn't exist
        const { data: newGroup, error: createError } = await supabase
          .from("groups")
          .insert({ group_name: groupName.trim() })
          .select("id")
          .single()

        if (createError || !newGroup) {
          throw new Error(`그룹 생성 실패: ${createError?.message || "알 수 없는 오류"}`)
        }
        group = newGroup
      }

      // Generate email identifier for Supabase auth (requires email format)
      const email = `${userId.trim().toLowerCase()}@challenge.local`

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            user_id: userId.trim(),
            nickname: nickname.trim(),
            group_id: group.id,
          },
        },
      })

      if (authError) throw authError

      // Wait for trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verify profile was created
      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", authData.user.id)
          .single()

        if (!profile) {
          // Try to create profile manually if trigger didn't work
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: authData.user.id,
              user_id: userId.trim(),
              nickname: nickname.trim(),
              group_id: group.id,
            })

          if (profileError) {
            throw new Error("프로필 생성 실패")
          }
        } else {
          // Update profile with nickname if it already exists
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ nickname: nickname.trim() })
            .eq("id", authData.user.id)

          if (updateError) {
            console.error("Failed to update nickname:", updateError)
          }
        }
      }

      router.push("/dashboard")
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
            <CardTitle className="text-3xl font-bold text-amber-900">챌린지에 참여하기</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="userId">ID (영어로 입력해주세요)</Label>
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
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nickname">닉네임</Label>
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="대시보드에 표시될 닉네임을 입력하세요"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="groupName">그룹명</Label>
                  <Select value={groupName} onValueChange={setGroupName} required>
                    <SelectTrigger id="groupName" className="w-full">
                      <SelectValue placeholder="그룹명을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_NAMES.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
                  {isLoading ? "계정 생성 중..." : "회원가입"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                이미 계정이 있으신가요?{" "}
                <Link href="/auth/login" className="underline underline-offset-4 text-amber-700 hover:text-amber-900">
                  로그인
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
