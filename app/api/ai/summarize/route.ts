// app/api/ai/summarize/route.ts
// 노트 요약 API 엔드포인트
// Gemini API를 사용하여 노트 내용을 요약하는 서버 액션
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/index.ts

import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (개발환경에서는 선택적)
    if (process.env.NODE_ENV === 'production') {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { error: '인증이 필요합니다.' },
          { status: 401 }
        )
      }
    }

    // 요청 데이터 파싱
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '노트 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    if (content.length < 10) {
      return NextResponse.json(
        { error: '요약하기에는 내용이 너무 짧습니다.' },
        { status: 400 }
      )
    }

    // AI 요약 생성
    const prompt = `다음 노트를 간단명료하게 3-5줄로 요약해주세요. 핵심 내용만 포함하고 불필요한 설명은 제외하세요:

${content}`

    const summary = await generateText(prompt, {
      maxTokens: 300,
      temperature: 0.3 // 일관된 요약을 위해 낮은 온도 설정
    })

    return NextResponse.json({
      success: true,
      summary: summary.trim()
    })

  } catch (error) {
    console.error('AI 요약 에러:', error)
    
    return NextResponse.json(
      { error: 'AI 요약 생성에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
