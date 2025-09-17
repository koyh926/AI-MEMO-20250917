// app/api/notes/generate-summary/route.ts
// 노트 내용 기반 자동 요약 생성 API 엔드포인트
// Gemini API를 사용하여 노트 내용을 3-6개 불릿 포인트로 요약
// 관련 파일: lib/ai/index.ts, lib/db/schema/notes.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/ai'
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

    // 요청 데이터 파싱
    const { noteId, content } = await request.json()

    if (!noteId || !content) {
      return NextResponse.json(
        { error: '노트 ID와 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    // 내용 길이 검증
    if (content.length < 100) {
      return NextResponse.json(
        { error: '요약하기에는 내용이 너무 짧습니다. 최소 100자 이상 입력해주세요.' },
        { status: 400 }
      )
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: '노트 내용이 너무 깁니다. 10,000자 이하로 줄여주세요.' },
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

    // 요약 생성 시작 - 노트 업데이트 시간만 갱신
    await db
      .update(notes)
      .set({
        updatedAt: new Date()
      })
      .where(eq(notes.id, noteId))

    // AI 요약 생성
    const prompt = `다음 노트 내용을 3-6개의 불릿 포인트로 요약해주세요.

규칙:
- 각 불릿 포인트는 한 문장으로 작성
- 중요도 순으로 정렬  
- 핵심 내용만 간결하고 명확하게 표현
- 불필요한 세부사항 제외
- 각 포인트 앞에 • 기호 사용

노트 내용:
${content}

요약:`

    const summary = await generateText(prompt, {
      maxTokens: 500,
      temperature: 0.3 // 일관된 요약을 위해 낮은 온도 설정
    })

    // 요약 후처리 (불필요한 공백 제거 및 포맷팅)
    const cleanedSummary = summary
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // 불릿 포인트가 없으면 추가
        if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*')) {
          return `• ${line}`
        }
        return line.replace(/^[-*]/, '•') // 다른 불릿 기호를 • 로 통일
      })
      .join('\n')

    // 요약 저장 (새로운 테이블 구조)
    await saveNoteSummary(noteId, cleanedSummary)
    
    // 노트 업데이트 시간 갱신
    await db
      .update(notes)
      .set({
        updatedAt: new Date()
      })
      .where(eq(notes.id, noteId))

    return NextResponse.json({
      success: true,
      summary: cleanedSummary,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('요약 생성 에러:', error)
    
    // 노트 업데이트 시간 갱신
    try {
      const { noteId } = await request.json().catch(() => ({}))
      if (noteId) {
        await db.update(notes)
          .set({ updatedAt: new Date() })
          .where(eq(notes.id, noteId))
      }
    } catch (updateError) {
      console.error('노트 업데이트 실패:', updateError)
    }
    
    // 에러 타입에 따른 적절한 응답
    let errorMessage = '요약 생성에 실패했습니다. 잠시 후 다시 시도해주세요.'
    let statusCode = 500
    
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as Error).message
      if (message.includes('API 키') || message.includes('인증')) {
        errorMessage = 'AI 서비스 인증에 실패했습니다. 관리자에게 문의하세요.'
        statusCode = 401
      } else if (message.includes('한도') || message.includes('quota')) {
        errorMessage = 'AI 서비스 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.'
        statusCode = 429
      } else if (message.includes('네트워크') || message.includes('연결')) {
        errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.'
        statusCode = 503
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
