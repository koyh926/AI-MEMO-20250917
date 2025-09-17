// app/api/notes/update-summary/route.ts
// 노트 요약 수정 API 엔드포인트 - 사용자가 직접 요약을 수정할 수 있도록 함
// 새로운 summaries 테이블에 수정된 요약을 저장
// 관련 파일: lib/notes/queries.ts, lib/db/schema/notes.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/connection'
import { notes } from '@/lib/db/schema/notes'
import { eq, and } from 'drizzle-orm'
import { saveNoteSummary } from '@/lib/notes/queries'

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { noteId, summary } = await request.json()

    if (!noteId || !summary) {
      return NextResponse.json(
        { error: '노트 ID와 요약 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    // 노트 존재 및 권한 확인
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    if (!note) {
      return NextResponse.json(
        { error: '노트를 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 }
      )
    }

    // 요약 저장 (새로운 테이블 구조)
    await saveNoteSummary(noteId, summary)
    
    // 노트 업데이트 시간 갱신
    await db
      .update(notes)
      .set({
        updatedAt: new Date()
      })
      .where(eq(notes.id, noteId))

    return NextResponse.json({
      success: true,
      summary,
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('요약 수정 에러:', error)
    
    return NextResponse.json(
      { error: '요약 수정에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
