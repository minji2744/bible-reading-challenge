"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [selectedGroupName, setSelectedGroupName] = useState("")
  const [groupMap, setGroupMap] = useState<Map<string, string>>(new Map()) // Map group name to group ID
  const [error, setError] = useState<string | null>(null)
  const [groupError, setGroupError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const router = useRouter()

  // Predefined groups that should always be available
  const predefinedGroups = ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"]

  useEffect(() => {
    const fetchOrCreateGroups = async () => {
      const supabase = createClient()
      const newGroupMap = new Map<string, string>()
      
      try {
        // Try to fetch existing groups
        const { data, error: fetchError } = await supabase
          .from("groups")
          .select("id, name")
          .order("name", { ascending: true })

        // Check if table doesn't exist
        if (fetchError) {
          const isTableNotFound = fetchError.message?.includes("schema cache") || 
                                  fetchError.message?.includes("does not exist") ||
                                  fetchError.code === "PGRST116"
          
          if (isTableNotFound) {
            setGroupError("데이터베이스 테이블이 설정되지 않았습니다. 먼저 Supabase SQL Editor에서 SQL 스키마 스크립트를 실행해주세요.")
            setIsLoadingGroups(false)
            return
          }
          console.error("Error fetching groups:", fetchError)
        }

        // Build map of existing groups
        if (data && data.length > 0) {
          data.forEach((group) => {
            const groupName = group.name.trim()
            if (predefinedGroups.includes(groupName)) {
              newGroupMap.set(groupName, group.id)
            }
          })
        }

        // For any missing groups, try to create them
        for (const groupName of predefinedGroups) {
          if (!newGroupMap.has(groupName)) {
            const { data: newGroup, error: createError } = await supabase
              .from("groups")
              .insert({ name: groupName })
              .select("id, name")
              .single()

            if (!createError && newGroup) {
              newGroupMap.set(newGroup.name, newGroup.id)
            } else if (createError) {
              const isTableNotFound = createError.message?.includes("schema cache") || 
                                      createError.message?.includes("does not exist") ||
                                      createError.code === "PGRST116"
              
              if (isTableNotFound) {
                setGroupError("데이터베이스 테이블이 설정되지 않았습니다. 먼저 Supabase SQL Editor에서 SQL 스키마 스크립트를 실행해주세요.")
                setIsLoadingGroups(false)
                return
              }
              console.error(`Error creating ${groupName}:`, createError)
            }
          }
        }

        setGroupMap(newGroupMap)
      } catch (err) {
        console.error("Error in fetchOrCreateGroups:", err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (errorMessage.includes("schema cache") || errorMessage.includes("does not exist")) {
          setGroupError("데이터베이스 테이블이 설정되지 않았습니다. 먼저 Supabase SQL Editor에서 SQL 스키마 스크립트를 실행해주세요.")
        }
      } finally {
        setIsLoadingGroups(false)
      }
    }
    fetchOrCreateGroups()
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!selectedGroupName) {
      setError("그룹을 선택해주세요")
      setIsLoading(false)
      return
    }

    try {
      // Get or create the group ID
      let groupId: string | undefined = groupMap.get(selectedGroupName)
      
      // If group doesn't exist in map, try to find or create it
      if (!groupId) {
        // Try to find existing group
        const { data: existingGroup, error: findError } = await supabase
          .from("groups")
          .select("id")
          .eq("name", selectedGroupName)
          .single()

        // Check if table doesn't exist
        if (findError) {
          const isTableNotFound = findError.message?.includes("schema cache") || 
                                  findError.message?.includes("does not exist") ||
                                  findError.code === "PGRST116"
          
          if (isTableNotFound) {
            throw new Error("데이터베이스 테이블이 설정되지 않았습니다. 먼저 Supabase SQL Editor에서 SQL 스키마 스크립트(scripts/001_create_schema.sql)를 실행해주세요. 지침은 README.md를 참조하세요.")
          }
        }

        if (existingGroup?.id) {
          const foundGroupId = existingGroup.id
          groupId = foundGroupId
          const updatedMap = new Map(groupMap)
          updatedMap.set(selectedGroupName, foundGroupId)
          setGroupMap(updatedMap)
        } else {
          // Create the group if it doesn't exist
          const { data: newGroup, error: createError } = await supabase
            .from("groups")
            .insert({ name: selectedGroupName })
            .select("id")
            .single()

          if (createError || !newGroup?.id) {
            const isTableNotFound = createError?.message?.includes("schema cache") || 
                                    createError?.message?.includes("does not exist") ||
                                    createError?.code === "PGRST116"
            
            if (isTableNotFound) {
              throw new Error("데이터베이스 테이블이 설정되지 않았습니다. 먼저 Supabase SQL Editor에서 SQL 스키마 스크립트(scripts/001_create_schema.sql)를 실행해주세요. 지침은 README.md를 참조하세요.")
            }
            throw new Error(`그룹 생성 실패: ${createError?.message || "알 수 없는 오류"}`)
          }
          
          const createdGroupId = newGroup.id
          groupId = createdGroupId
          const updatedMap = new Map(groupMap)
          updatedMap.set(selectedGroupName, createdGroupId)
          setGroupMap(updatedMap)
        }
      }

      if (!groupId) {
        throw new Error("그룹 ID를 확인할 수 없습니다")
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            group_id: groupId,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Wait a bit for the trigger to potentially create the profile
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Check if profile already exists (created by trigger)
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", authData.user.id)
          .single()

        // If profile doesn't exist, try to create it
        if (!existingProfile) {
          // Refresh session to ensure we have auth context
          const { data: sessionData } = await supabase.auth.getSession()
          
          if (sessionData.session) {
            const { error: profileError } = await supabase.from("profiles").insert({
              id: authData.user.id,
              email,
              full_name: fullName,
              group_id: groupId,
            })

            if (profileError) {
              // If insert fails, check if it was created by trigger in the meantime
              const { data: checkProfile } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", authData.user.id)
                .single()
              
              if (!checkProfile) {
                throw profileError
              }
              // Profile exists now, continue
            }
          } else {
            // No session yet, but trigger should have created it
            // Wait a bit more and check again
            await new Promise(resolve => setTimeout(resolve, 1000))
            const { data: finalCheck } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", authData.user.id)
              .single()
            
            if (!finalCheck) {
              throw new Error("프로필이 생성되지 않았습니다. 다시 시도하거나 지원팀에 문의하세요.")
            }
          }
        }
      }

      router.push("/auth/sign-up-success")
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
            <CardDescription className="text-amber-700">계정을 만들어 추적을 시작하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">이름</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="이름을 입력하세요"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  <Label htmlFor="group">그룹 선택</Label>
                  {isLoadingGroups ? (
                    <div className="flex h-9 w-full items-center justify-center rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                      그룹 불러오는 중...
                    </div>
                  ) : (
                    <Select value={selectedGroupName} onValueChange={setSelectedGroupName} required>
                      <SelectTrigger id="group" className="w-full">
                        <SelectValue placeholder="그룹을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedGroups.map((groupName) => (
                          <SelectItem key={groupName} value={groupName}>
                            {groupName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {groupError && <p className="text-sm text-amber-600">{groupError}</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isLoading || isLoadingGroups}>
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
