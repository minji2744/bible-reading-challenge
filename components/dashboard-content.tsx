"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { BibleReadingTable } from "@/components/bible-reading-table"
import { MonthlyLeaderboard } from "@/components/monthly-leaderboard"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { BookOpen, LogOut, Users, Trophy, BookMarked } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

type Profile = {
  user_id: string
  nickname: string | null
  group_id: string
  groups: { group_name: string }
}

type GroupMember = {
  id: string
  user_id: string
  nickname: string | null
  total_chapters: number
}

type Reading = {
  id: string
  chapters_read: number
  reading_date: string
  book?: string | null
  start_chapter?: number | null
}

export function DashboardContent({
  user,
  profile,
  userReadings,
  userTotal,
}: {
  user: any
  profile: Profile | null
  userReadings: Reading[]
  userTotal: number
}) {
  const [activeTab, setActiveTab] = useState("reading")
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [isLoadingGroup, setIsLoadingGroup] = useState(false)
  const router = useRouter()

  // Bible chapters list (66 books of the Bible)
  const bibleChapters = [
    { book: "Genesis", chapters: 50 },
    { book: "Exodus", chapters: 40 },
    { book: "Leviticus", chapters: 27 },
    { book: "Numbers", chapters: 36 },
    { book: "Deuteronomy", chapters: 34 },
    { book: "Joshua", chapters: 24 },
    { book: "Judges", chapters: 20 },
    { book: "Ruth", chapters: 4 },
    { book: "1 Samuel", chapters: 31 },
    { book: "2 Samuel", chapters: 24 },
    { book: "1 Kings", chapters: 22 },
    { book: "2 Kings", chapters: 25 },
    { book: "1 Chronicles", chapters: 29 },
    { book: "2 Chronicles", chapters: 36 },
    { book: "Ezra", chapters: 10 },
    { book: "Nehemiah", chapters: 10 },
    { book: "Esther", chapters: 10 },
    { book: "Job", chapters: 42 },
    { book: "Psalms", chapters: 150 },
    { book: "Proverbs", chapters: 31 },
    { book: "Ecclesiastes", chapters: 12 },
    { book: "Song of Solomon", chapters: 8 },
    { book: "Isaiah", chapters: 66 },
    { book: "Jeremiah", chapters: 52 },
    { book: "Lamentations", chapters: 5 },
    { book: "Ezekiel", chapters: 50 },
    { book: "Daniel", chapters: 12 },
    { book: "Hosea", chapters: 14 },
    { book: "Joel", chapters: 3 },
    { book: "Amos", chapters: 9 },
    { book: "Obadiah", chapters: 1 },
    { book: "Jonah", chapters: 4 },
    { book: "Micah", chapters: 7 },
    { book: "Nahum", chapters: 3 },
    { book: "Habakkuk", chapters: 3 },
    { book: "Zephaniah", chapters: 3 },
    { book: "Haggai", chapters: 2 },
    { book: "Zechariah", chapters: 14 },
    { book: "Malachi", chapters: 4 },
    { book: "Matthew", chapters: 28 },
    { book: "Mark", chapters: 16 },
    { book: "Luke", chapters: 24 },
    { book: "John", chapters: 21 },
    { book: "Acts", chapters: 28 },
    { book: "Romans", chapters: 16 },
    { book: "1 Corinthians", chapters: 16 },
    { book: "2 Corinthians", chapters: 13 },
    { book: "Galatians", chapters: 6 },
    { book: "Ephesians", chapters: 6 },
    { book: "Philippians", chapters: 4 },
    { book: "Colossians", chapters: 4 },
    { book: "1 Thessalonians", chapters: 5 },
    { book: "2 Thessalonians", chapters: 3 },
    { book: "1 Timothy", chapters: 6 },
    { book: "2 Timothy", chapters: 4 },
    { book: "Titus", chapters: 3 },
    { book: "Philemon", chapters: 1 },
    { book: "Hebrews", chapters: 13 },
    { book: "James", chapters: 5 },
    { book: "1 Peter", chapters: 5 },
    { book: "2 Peter", chapters: 3 },
    { book: "1 John", chapters: 5 },
    { book: "2 John", chapters: 1 },
    { book: "3 John", chapters: 1 },
    { book: "Jude", chapters: 1 },
    { book: "Revelation", chapters: 22 },
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const fetchGroupMembers = async (showLoading = true) => {
    if (!profile?.group_id) return

    if (showLoading) setIsLoadingGroup(true)
    const supabase = createClient()
    const currentDate = new Date()
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    try {
      // First, fetch all profiles in the same group
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, nickname")
        .eq("group_id", profile.group_id)

      if (profilesError) throw profilesError

      if (!profiles || profiles.length === 0) {
        setGroupMembers([])
        return
      }

      // Then, fetch readings for these users in the current month
      const { data: readings, error: readingsError } = await supabase
        .from("readings")
        .select("user_id, chapters_read")
        .in(
          "user_id",
          profiles.map((p) => p.id),
        )
        .gte("reading_date", firstDay.toISOString().split("T")[0])
        .lte("reading_date", lastDay.toISOString().split("T")[0])

      if (readingsError) throw readingsError

      // Calculate totals for each member
      const readingTotals = readings?.reduce((acc: Record<string, number>, reading: any) => {
        const userId = reading.user_id
        acc[userId] = (acc[userId] || 0) + reading.chapters_read
        return acc
      }, {}) || {}

      // Combine profiles with their reading totals
      const members: GroupMember[] = profiles.map((profile) => ({
        id: profile.id,
        user_id: profile.user_id,
        nickname: profile.nickname,
        total_chapters: readingTotals[profile.id] || 0,
      }))

      // Sort by total chapters (descending)
      setGroupMembers(members.sort((a, b) => b.total_chapters - a.total_chapters))
    } catch (err) {
      console.error("Error fetching group members:", err)
    } finally {
      if (showLoading) setIsLoadingGroup(false)
    }
  }

  useEffect(() => {
    if (activeTab === "group" && groupMembers.length === 0 && profile?.group_id) {
      fetchGroupMembers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile?.group_id])

  const currentMonth = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    year: "numeric",
  })

  // Function to get Korean book name
  const getKoreanBookName = (bookName: string): string => {
    const bookMap: Record<string, string> = {
      Genesis: "창세기",
      Exodus: "출애굽기",
      Leviticus: "레위기",
      Numbers: "민수기",
      Deuteronomy: "신명기",
      Joshua: "여호수아",
      Judges: "사사기",
      Ruth: "룻기",
      "1 Samuel": "사무엘상",
      "2 Samuel": "사무엘하",
      "1 Kings": "열왕기상",
      "2 Kings": "열왕기하",
      "1 Chronicles": "역대상",
      "2 Chronicles": "역대하",
      Ezra: "에스라",
      Nehemiah: "느헤미야",
      Esther: "에스더",
      Job: "욥기",
      Psalms: "시편",
      Proverbs: "잠언",
      Ecclesiastes: "전도서",
      "Song of Solomon": "아가",
      Isaiah: "이사야",
      Jeremiah: "예레미야",
      Lamentations: "예레미야애가",
      Ezekiel: "에스겔",
      Daniel: "다니엘",
      Hosea: "호세아",
      Joel: "요엘",
      Amos: "아모스",
      Obadiah: "오바댜",
      Jonah: "요나",
      Micah: "미가",
      Nahum: "나훔",
      Habakkuk: "하박국",
      Zephaniah: "스바냐",
      Haggai: "학개",
      Zechariah: "스가랴",
      Malachi: "말라기",
      Matthew: "마태복음",
      Mark: "마가복음",
      Luke: "누가복음",
      John: "요한복음",
      Acts: "사도행전",
      Romans: "로마서",
      "1 Corinthians": "고린도전서",
      "2 Corinthians": "고린도후서",
      Galatians: "갈라디아서",
      Ephesians: "에베소서",
      Philippians: "빌립보서",
      Colossians: "골로새서",
      "1 Thessalonians": "데살로니가전서",
      "2 Thessalonians": "데살로니가후서",
      "1 Timothy": "디모데전서",
      "2 Timothy": "디모데후서",
      Titus: "디도서",
      Philemon: "빌레몬서",
      Hebrews: "히브리서",
      James: "야고보서",
      "1 Peter": "베드로전서",
      "2 Peter": "베드로후서",
      "1 John": "요한일서",
      "2 John": "요한이서",
      "3 John": "요한삼서",
      Jude: "유다서",
      Revelation: "요한계시록",
    }
    return bookMap[bookName] || bookName
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-gradient-to-br from-amber-50 to-orange-50">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2">
              <BookOpen className="h-6 w-6 text-amber-600" />
              <span className="font-bold text-amber-900">성경 읽기 챌린지</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>내비게이션</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === "reading"}
                      onClick={() => setActiveTab("reading")}
                      tooltip="읽기 기록"
                    >
                      <BookMarked className="h-4 w-4" />
                      <span>읽기 기록</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === "group"}
                      onClick={() => setActiveTab("group")}
                      tooltip="내 그룹"
                    >
                      <Users className="h-4 w-4" />
                      <span>내 그룹</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeTab === "all-groups"}
                      onClick={() => setActiveTab("all-groups")}
                      tooltip="모든 그룹"
                    >
                      <Trophy className="h-4 w-4" />
                      <span>모든 그룹</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span>로그아웃</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm">
            <div className="flex h-16 items-center gap-4 px-4">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-amber-900">
                  {profile?.nickname || profile?.user_id || "사용자"}님, 환영합니다!
                </h1>
                <p className="text-sm text-amber-700">
                  {profile?.groups.group_name} • {currentMonth}
                </p>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="hidden">
                <TabsTrigger value="reading">읽기 기록</TabsTrigger>
                <TabsTrigger value="group">내 그룹</TabsTrigger>
                <TabsTrigger value="all-groups">모든 그룹</TabsTrigger>
              </TabsList>

              {/* Tab 1: Bible Reading Table */}
              <TabsContent value="reading" className="space-y-6">
                <BibleReadingTable userId={user.id} />
              </TabsContent>

              {/* Tab 2: My Group */}
              <TabsContent value="group" className="space-y-6">
                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Users className="h-5 w-5" />
                      {profile?.groups.group_name} - 그룹 진행 상황
                    </CardTitle>
                    <CardDescription>이번 달 그룹 멤버들의 읽기 현황을 확인하세요</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingGroup ? (
                      <p className="text-center text-sm text-muted-foreground">Loading...</p>
                    ) : groupMembers.length > 0 ? (
                      <div className="space-y-4">
                        {groupMembers.map((member, index) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-lg border border-amber-100 bg-white p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                                  index === 0
                                    ? "bg-amber-500 text-white"
                                    : index === 1
                                      ? "bg-amber-300 text-amber-900"
                                      : index === 2
                                        ? "bg-amber-200 text-amber-900"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <span className="font-medium text-amber-900">
                                {member.nickname || member.user_id}
                                {member.id === user.id && " (나)"}
                              </span>
                            </div>
                            <span className="text-lg font-bold text-amber-600">
                              {member.total_chapters}장
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        아직 이번 달 읽기 기록을 한 그룹 멤버가 없습니다.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Monthly Leaderboard */}
              <TabsContent value="all-groups" className="space-y-6">
                <MonthlyLeaderboard userGroupId={profile?.group_id} />
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
