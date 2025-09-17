// app/api/ai/generate-tags/route.ts
// 노트 태그 생성 API 엔드포인트
// Gemini API를 사용하여 노트 내용에 적합한 태그를 생성하는 서버 액션
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
    const { title, content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '노트 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    // AI 태그 생성
    const prompt = `다음 노트에 적합한 태그 3-5개를 생성해주세요. 태그는 한글로 작성하고, 콤마로 구분하세요. 태그만 응답하고 다른 설명은 포함하지 마세요.

제목: ${title || '제목 없음'}
내용: ${content}`

    const tagsResponse = await generateText(prompt, {
      maxTokens: 100,
      temperature: 0.4
    })

    // 태그 파싱 및 정리
    const tags = tagsResponse
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length < 20)
      .slice(0, 5) // 최대 5개

    return NextResponse.json({
      success: true,
      tags
    })

  } catch (error) {
    console.error('AI 태그 생성 에러:', error)
    
    return NextResponse.json(
      { error: 'AI 태그 생성에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
