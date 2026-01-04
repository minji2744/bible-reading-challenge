"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
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

type GroupProgress = {
  group_id: string
  group_name: string
  total_chapters: number
  member_count: number
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
  const [chaptersRead, setChaptersRead] = useState("")
  const [selectedBook, setSelectedBook] = useState("")
  const [selectedChapterNumber, setSelectedChapterNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [allGroupsProgress, setAllGroupsProgress] = useState<GroupProgress[]>([])
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

  const handleSubmitReading = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()
    const today = new Date().toISOString().split("T")[0]

    try {
      const chapters = Number.parseInt(chaptersRead)
      if (isNaN(chapters) || chapters <= 0) {
        throw new Error("올바른 장 수를 입력하세요")
      }

      if (!selectedBook || !selectedChapterNumber) {
        throw new Error("성경 장을 선택하세요")
      }

      const startChapter = Number.parseInt(selectedChapterNumber)
      const { error } = await supabase.from("readings").upsert(
        {
          user_id: user.id,
          chapters_read: chapters,
          reading_date: today,
          book: selectedBook,
          start_chapter: startChapter,
        },
        {
          onConflict: "user_id,reading_date",
        },
      )

      if (error) throw error

      setChaptersRead("")
      setSelectedBook("")
      setSelectedChapterNumber("")
      
      // Refresh the page data
      router.refresh()
      
      // Update group status and total status after registering a reading
      // This ensures the data is fresh when users view those tabs
      // Call them in parallel for better performance, without showing loading indicator
      const refreshPromises = []
      if (profile?.group_id) {
        refreshPromises.push(fetchGroupMembers(false))
      }
      refreshPromises.push(fetchAllGroupsProgress(false))
      await Promise.all(refreshPromises)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
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

  const fetchAllGroupsProgress = async (showLoading = true) => {
    if (showLoading) setIsLoadingGroup(true)
    const supabase = createClient()
    const currentDate = new Date()
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    try {
      // First, fetch all groups - always show all groups regardless of members or readings
      const { data: groups, error: groupsError } = await supabase
        .from("groups")
        .select("id, group_name")

      if (groupsError) {
        console.error("Error fetching groups:", groupsError)
        setAllGroupsProgress([])
        return
      }

      if (!groups || groups.length === 0) {
        setAllGroupsProgress([])
        return
      }

      // Initialize all groups with 0 values
      const memberCounts: Record<string, number> = {}
      const readingTotals: Record<string, number> = {}
      groups.forEach((group) => {
        memberCounts[group.id] = 0
        readingTotals[group.id] = 0
      })

      // Fetch all profiles to count members per group (non-blocking - if it fails, use 0)
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, group_id")

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError)
        } else if (profiles) {
          // Count actual members
          profiles.forEach((profile: any) => {
            if (profile.group_id && memberCounts.hasOwnProperty(profile.group_id)) {
              memberCounts[profile.group_id] = (memberCounts[profile.group_id] || 0) + 1
            }
          })
        }
      } catch (err) {
        console.error("Error processing profiles:", err)
        // Continue with 0 member counts
      }

      // Fetch readings for the current month (non-blocking - if it fails, use 0)
      try {
        // First, get all user IDs that have profiles with group_id
        const { data: profilesWithGroups, error: profilesError } = await supabase
          .from("profiles")
          .select("id, group_id")
          .not("group_id", "is", null)

        if (profilesError) {
          console.error("Error fetching profiles for readings:", profilesError)
          // Continue with 0 reading totals
        } else if (profilesWithGroups && profilesWithGroups.length > 0) {
          // Create a map of user_id to group_id
          const userIdToGroupId: Record<string, string> = {}
          profilesWithGroups.forEach((profile: any) => {
            if (profile.id && profile.group_id) {
              userIdToGroupId[profile.id] = profile.group_id
            }
          })

          // Now fetch readings for these users
          const { data: readings, error: readingsError } = await supabase
            .from("readings")
            .select("user_id, chapters_read")
            .in("user_id", Object.keys(userIdToGroupId))
            .gte("reading_date", firstDay.toISOString().split("T")[0])
            .lte("reading_date", lastDay.toISOString().split("T")[0])

          if (readingsError) {
            console.error("Error fetching readings:", readingsError)
            // Continue with 0 reading totals
          } else if (readings && readings.length > 0) {
            // Add actual reading totals
            readings.forEach((reading: any) => {
              const groupId = userIdToGroupId[reading.user_id]
              if (groupId && readingTotals.hasOwnProperty(groupId)) {
                readingTotals[groupId] = (readingTotals[groupId] || 0) + (reading.chapters_read || 0)
              }
            })
          }
        }
        // If no profiles with groups or no readings, readingTotals already initialized to 0
      } catch (err) {
        console.error("Error processing readings:", err)
        // Continue with 0 reading totals - don't throw error
      }

      // Combine all groups with their member counts and reading totals
      // This ensures ALL groups are shown, even with 0 members and 0 chapters
      const allGroups: GroupProgress[] = groups.map((group) => ({
        group_id: group.id,
        group_name: group.group_name,
        total_chapters: readingTotals[group.id] ?? 0,
        member_count: memberCounts[group.id] ?? 0,
      }))

      // Sort by total chapters (descending)
      setAllGroupsProgress(allGroups.sort((a, b) => b.total_chapters - a.total_chapters))
    } catch (err) {
      console.error("Error fetching groups progress:", err)
      setAllGroupsProgress([])
    } finally {
      if (showLoading) setIsLoadingGroup(false)
    }
  }

  useEffect(() => {
    if (activeTab === "group" && groupMembers.length === 0 && profile?.group_id) {
      fetchGroupMembers()
    }
    if (activeTab === "all-groups" && allGroupsProgress.length === 0) {
      fetchAllGroupsProgress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile?.group_id])

  const currentMonth = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    year: "numeric",
  })

  // Get the most recent reading with book and chapter info
  const mostRecentReading = userReadings.find((r) => r.book && r.start_chapter)

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

              {/* Tab 1: Log Reading */}
              <TabsContent value="reading" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-900">
                        <BookMarked className="h-5 w-5" />
                        오늘의 읽기 기록
                      </CardTitle>
                      <CardDescription>성경책을 선택하고 읽은 장 수를 기록하세요</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmitReading} className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="book">성경 책</Label>
                          <Select
                            value={selectedBook}
                            onValueChange={(value) => {
                              setSelectedBook(value)
                              setSelectedChapterNumber("") // Reset chapter when book changes
                            }}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="책을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {bibleChapters.map((book) => (
                                <SelectItem key={book.book} value={book.book}>
                                  {getKoreanBookName(book.book)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="chapter">몇 장부터 읽기 시작하셨나요?</Label>
                          <Select
                            value={selectedChapterNumber}
                            onValueChange={setSelectedChapterNumber}
                            required
                            disabled={!selectedBook}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={selectedBook ? "장을 선택하세요" : "먼저 책을 선택하세요"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {selectedBook &&
                                Array.from(
                                  { length: bibleChapters.find((b) => b.book === selectedBook)?.chapters || 0 },
                                  (_, i) => i + 1,
                                ).map((chapter) => (
                                  <SelectItem key={chapter} value={chapter.toString()}>
                                    {chapter}장
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="chapters">읽은 장 수</Label>
                          <Input
                            id="chapters"
                            type="number"
                            min="1"
                            placeholder="0"
                            value={chaptersRead}
                            onChange={(e) => setChaptersRead(e.target.value)}
                            required
                          />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <Button
                          type="submit"
                          className="w-full bg-amber-600 hover:bg-amber-700"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "저장 중..." : "읽기 저장"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-amber-900">이번 달 진행 상황</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className="text-6xl font-bold text-amber-600">{userTotal}</p>
                        <p className="mt-2 text-sm text-muted-foreground">읽은 장 수</p>
                        {mostRecentReading && mostRecentReading.book && mostRecentReading.start_chapter && (
                          <div className="mt-4 rounded-lg bg-amber-50 p-4">
                            <p className="text-sm font-medium text-amber-900">
                              {getKoreanBookName(mostRecentReading.book)} {mostRecentReading.start_chapter}장 부터{" "}
                              {mostRecentReading.start_chapter + mostRecentReading.chapters_read - 1}장까지 읽으셨네요! 잘하셨습니다!
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-amber-900">최근 읽기 기록</CardTitle>
                    <CardDescription>지난 7일 활동</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userReadings.length > 0 ? (
                      <div className="space-y-2">
                        {userReadings.slice(0, 7).map((reading) => (
                          <div
                            key={reading.id}
                            className="flex items-center justify-between rounded-lg border border-amber-100 bg-white p-3"
                          >
                            <span className="text-sm text-muted-foreground">
                              {new Date(reading.reading_date).toLocaleDateString("ko-KR", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="font-semibold text-amber-600">
                              {reading.chapters_read}장
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        아직 기록된 읽기가 없습니다. 오늘부터 기록을 시작하세요!
                      </p>
                    )}
                  </CardContent>
                </Card>
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

              {/* Tab 3: All Groups */}
              <TabsContent value="all-groups" className="space-y-6">
                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Trophy className="h-5 w-5" />
                      모든 그룹 리더보드
                    </CardTitle>
                    <CardDescription>{currentMonth} 그룹 순위</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingGroup ? (
                      <p className="text-center text-sm text-muted-foreground">로딩 중...</p>
                    ) : allGroupsProgress.length > 0 ? (
                      <div className="space-y-4">
                        {allGroupsProgress.map((group, index) => (
                          <div
                            key={group.group_id}
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
                              <div className="flex flex-col">
                                <span className="font-medium text-amber-900">
                                  {group.group_name}
                                  {group.group_id === profile?.group_id && " (내 그룹)"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  멤버 {group.member_count}명
                                </span>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-amber-600">
                              {group.total_chapters}장
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        그룹이 없습니다.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
