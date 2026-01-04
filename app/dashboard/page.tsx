import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // 사용자 프로필 가져오기
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, groups(group_name)")
    .eq("id", data.user.id)
    .single()

  // 현재 월의 사용자 읽기 기록 가져오기
  const currentDate = new Date()
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const { data: userReadings } = await supabase
    .from("readings")
    .select("*")
    .eq("user_id", data.user.id)
    .gte("reading_date", firstDay.toISOString().split("T")[0])
    .lte("reading_date", lastDay.toISOString().split("T")[0])
    .order("reading_date", { ascending: false })

  const userTotal = userReadings?.reduce((sum, r) => sum + r.chapters_read, 0) || 0

  return (
    <DashboardContent
      user={data.user}
      profile={profile}
      userReadings={userReadings || []}
      userTotal={userTotal}
    />
  )
}
