"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react"

type GroupProgress = {
  group_id: string
  group_name: string
  total_chapters: number
  member_count: number
}

type MonthData = {
  month: number
  year: number
  name: string
}

const MONTHS_2026 = [
  { month: 0, year: 2026, name: "2026년 1월" },
  { month: 1, year: 2026, name: "2026년 2월" },
  { month: 2, year: 2026, name: "2026년 3월" },
  { month: 3, year: 2026, name: "2026년 4월" },
  { month: 4, year: 2026, name: "2026년 5월" },
  { month: 5, year: 2026, name: "2026년 6월" },
  { month: 6, year: 2026, name: "2026년 7월" },
  { month: 7, year: 2026, name: "2026년 8월" },
  { month: 8, year: 2026, name: "2026년 9월" },
  { month: 9, year: 2026, name: "2026년 10월" },
  { month: 10, year: 2026, name: "2026년 11월" },
  { month: 11, year: 2026, name: "2026년 12월" },
]

export function MonthlyLeaderboard({ userGroupId }: { userGroupId?: string }) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  const [groupsData, setGroupsData] = useState<GroupProgress[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const currentMonthData = MONTHS_2026[currentMonthIndex]

  const fetchGroupsForMonth = async (monthData: MonthData) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Get first and last day of the month
      const firstDay = new Date(monthData.year, monthData.month, 1)
      const lastDay = new Date(monthData.year, monthData.month + 1, 0)

      // Fetch all groups
      const { data: groups, error: groupsError } = await supabase
        .from("groups")
        .select("id, group_name")

      if (groupsError) {
        console.error("Error fetching groups:", groupsError)
        setGroupsData([])
        return
      }

      if (!groups || groups.length === 0) {
        setGroupsData([])
        return
      }

      // Initialize all groups with 0 values
      const memberCounts: Record<string, number> = {}
      const readingTotals: Record<string, number> = {}
      groups.forEach((group) => {
        memberCounts[group.id] = 0
        readingTotals[group.id] = 0
      })

      // Fetch all profiles to count members per group
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
      }

      // Fetch readings for the specified month
      try {
        const { data: profilesWithGroups, error: profilesError } = await supabase
          .from("profiles")
          .select("id, group_id")
          .not("group_id", "is", null)

        if (profilesError) {
          console.error("Error fetching profiles for readings:", profilesError)
        } else if (profilesWithGroups && profilesWithGroups.length > 0) {
          const userIdToGroupId: Record<string, string> = {}
          profilesWithGroups.forEach((profile: any) => {
            if (profile.id && profile.group_id) {
              userIdToGroupId[profile.id] = profile.group_id
            }
          })

          // Fetch readings for these users in the specified month
          const { data: readings, error: readingsError } = await supabase
            .from("readings")
            .select("user_id, chapters_read")
            .in("user_id", Object.keys(userIdToGroupId))
            .gte("reading_date", firstDay.toISOString().split("T")[0])
            .lte("reading_date", lastDay.toISOString().split("T")[0])

          if (readingsError) {
            console.error("Error fetching readings:", readingsError)
          } else if (readings && readings.length > 0) {
            readings.forEach((reading: any) => {
              const groupId = userIdToGroupId[reading.user_id]
              if (groupId && readingTotals.hasOwnProperty(groupId)) {
                readingTotals[groupId] = (readingTotals[groupId] || 0) + (reading.chapters_read || 0)
              }
            })
          }
        }
      } catch (err) {
        console.error("Error processing readings:", err)
      }

      // Combine all groups with their data
      const allGroups: GroupProgress[] = groups.map((group) => ({
        group_id: group.id,
        group_name: group.group_name,
        total_chapters: readingTotals[group.id] ?? 0,
        member_count: memberCounts[group.id] ?? 0,
      }))

      // Sort by total chapters (descending)
      setGroupsData(allGroups.sort((a, b) => b.total_chapters - a.total_chapters))
    } catch (err) {
      console.error("Error fetching groups data:", err)
      setGroupsData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGroupsForMonth(currentMonthData)
  }, [currentMonthIndex])

  const handlePreviousMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonthIndex < MONTHS_2026.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1)
    }
  }

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Trophy className="h-5 w-5" />
              2026 Monthly Leaderboard
            </CardTitle>
            <CardDescription>Group rankings for all months in 2026</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              disabled={currentMonthIndex === 0}
              className="border-amber-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-32 text-center">
              <p className="font-semibold text-amber-900">{currentMonthData.name}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={currentMonthIndex === MONTHS_2026.length - 1}
              className="border-amber-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">로딩 중...</p>
        ) : groupsData.length > 0 ? (
          <div className="space-y-4">
            {groupsData.map((group, index) => (
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
                      {group.group_id === userGroupId && " (내 그룹)"}
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
            이 달에는 아직 읽기 기록이 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

