// app/api/notes/generate-tags/route.ts
// 노트별 태그 생성 API 엔드포인트 - 노트 내용 기반 AI 태그 자동 생성
// 인증된 사용자의 특정 노트에 대해 Gemini API로 관련성 높은 태그 3-6개 생성
// 관련 파일: lib/ai/gemini-client.ts, lib/notes/actions.ts, lib/db/schema/notes.ts

import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/connection'
import { notes } from '@/lib/db/schema/notes'
import { eq, and } from 'drizzle-orm'
import { updateNoteTags } from '@/lib/notes/queries'

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

    // 요청 데이터 파싱
    const { noteId, title, content } = await request.json()

    if (!noteId || !content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '노트 ID와 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    // 내용 길이 검증 (최소 50자)
    if (content.trim().length < 50) {
      return NextResponse.json(
        { error: '노트 내용이 너무 짧습니다. 최소 50자 이상 입력해주세요.' },
        { status: 400 }
      )
    }

    // 노트 소유권 확인
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

    // 태그 생성 상태를 'generating'으로 업데이트
    await db
      .update(notes)
      .set({
        updatedAt: new Date()
      })
      .where(eq(notes.id, noteId))

    try {
      // AI 태그 생성 (15초 타임아웃)
      const prompt = `다음 노트 내용에 적합한 태그 3-6개를 생성해주세요.
태그는 한글로 작성하고, 관련성이 높은 키워드여야 합니다.

규칙:
- 각 태그는 2-8자 이내
- 중복 제거
- 관련성 순으로 정렬
- 태그만 응답 (콤마로 구분)

제목: ${title || '제목 없음'}
내용: ${content}

태그:`

      const tagsResponse = await Promise.race([
        generateText(prompt, {
          maxTokens: 100,
          temperature: 0.4
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 15000)
        })
      ])

      // 태그 파싱 및 정리
      console.log('AI 응답:', tagsResponse) // 디버깅용
      
      const generatedTags = tagsResponse
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length >= 2 && tag.length <= 8)
        .slice(0, 6) // 최대 6개

      console.log('파싱된 태그:', generatedTags) // 디버깅용

      if (generatedTags.length === 0) {
        console.error('태그 파싱 실패 - 원본 응답:', tagsResponse)
        throw new Error('유효한 태그를 생성할 수 없습니다.')
      }

      // 태그 저장 (새로운 테이블 구조)
      await updateNoteTags(noteId, generatedTags)
      
      // 노트 업데이트 시간 갱신
      await db
        .update(notes)
        .set({
          updatedAt: new Date()
        })
        .where(eq(notes.id, noteId))

      return NextResponse.json({
        success: true,
        tags: generatedTags
      })

    } catch (error) {
      // 태그 생성 실패 시 노트 업데이트 시간만 갱신
      await db
        .update(notes)
        .set({
          updatedAt: new Date()
        })
        .where(eq(notes.id, noteId))

      const errorMessage = error instanceof Error && error.message === 'TIMEOUT'
        ? '태그 생성 시간이 초과되었습니다. 다시 시도해주세요.'
        : 'AI 태그 생성에 실패했습니다. 다시 시도해주세요.'

      throw new Error(errorMessage)
    }

  } catch (error) {
    console.error('태그 생성 에러:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'AI 태그 생성에 실패했습니다. 다시 시도해주세요.'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
