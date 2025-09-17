// app/api/auth/check-email-confirmation/route.ts
// 이메일 인증 상태 확인 API 엔드포인트
// 디버깅 및 문제 해결을 위한 엔드포인트
// 관련 파일: lib/auth/actions.ts, lib/supabase/server.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // 이메일로 사용자 조회
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('사용자 조회 에러:', error)
      return NextResponse.json(
        { error: '사용자 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const user = users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: '해당 이메일로 등록된 사용자가 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      }
    })

  } catch (error) {
    console.error('이메일 인증 상태 확인 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
