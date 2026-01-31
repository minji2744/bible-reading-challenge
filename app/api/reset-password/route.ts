import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "ID와 새 비밀번호를 입력해주세요" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 최소 6자 이상이어야 합니다" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("user_id", userId.trim())
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "해당 ID로 등록된 사용자를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    // Get the auth user ID from the profile
    // The profile.id is the auth.users.id (uuid) based on the schema
    const authUserId = profile.id

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json(
        { error: "서버 설정 오류가 발생했습니다" },
        { status: 500 }
      )
    }

    // Use admin client to update password
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Update password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      { password: newPassword }
    )

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json(
        { error: "비밀번호 업데이트에 실패했습니다" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

