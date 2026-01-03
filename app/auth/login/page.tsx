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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [groupName, setGroupName] = useState("")
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchGroups = async () => {
      const supabase = createClient()
      try {
        const { data, error: fetchError } = await supabase
          .from("groups")
          .select("id, name")
          .order("name", { ascending: true })

        if (fetchError) {
          console.error("Error fetching groups:", fetchError)
          return
        }

        if (data && data.length > 0) {
          // Filter to only show Group 1-5 if they exist
          const filteredGroups = data.filter((group) => {
            const groupName = group.name.trim()
            return groupName === "Group 1" || 
                   groupName === "Group 2" || 
                   groupName === "Group 3" || 
                   groupName === "Group 4" || 
                   groupName === "Group 5"
          })
          
          // Sort to ensure Group 1-5 appear in order
          const sortedGroups = filteredGroups.sort((a, b) => {
            const numA = parseInt(a.name.replace("Group ", ""))
            const numB = parseInt(b.name.replace("Group ", ""))
            return numA - numB
          })
          
          if (sortedGroups.length > 0) {
            setGroups(sortedGroups)
          }
        }
      } catch (err) {
        console.error("Error in fetchGroups:", err)
      }
    }
    fetchGroups()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!groupName) {
      setError("Please select a group")
      setIsLoading(false)
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (authError) throw authError

      // Verify user belongs to the selected group
      if (authData.user) {
        // Find the selected group's ID
        const selectedGroup = groups.find(g => g.name === groupName)
        
        if (!selectedGroup) {
          await supabase.auth.signOut()
          throw new Error("Selected group not found")
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("group_id")
          .eq("id", authData.user.id)
          .single()

        if (profileError) throw profileError

        // Compare group IDs directly
        if (!profile || profile.group_id !== selectedGroup.id) {
          await supabase.auth.signOut()
          throw new Error("User does not belong to the selected group")
        }
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-amber-900">성경 읽기 챌린지</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
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
                  <Label htmlFor="group">Group Name</Label>
                  <Select value={groupName} onValueChange={setGroupName} required>
                    <SelectTrigger>
                      <SelectValue placeholder="소속 조를 선택해주세요." />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.name}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
                  {isLoading ? "로그인 중..." : "로그인"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                계정이 없으신가요?{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4 text-amber-700 hover:text-amber-900">
                  가입하기
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
