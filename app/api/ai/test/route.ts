// app/api/ai/test/route.ts
// AI 기능 테스트 API 엔드포인트
// 스토리 4.1 구현 완료 후 기능 테스트를 위한 엔드포인트
// 관련 파일: lib/ai/index.ts, lib/ai/test.ts

import { NextRequest, NextResponse } from 'next/server'
import { runAllTests, testBasicTextGeneration, healthCheck } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    // URL 파라미터로 테스트 타입 결정
    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('type') || 'basic'

    let result

    switch (testType) {
      case 'health':
        const healthy = await healthCheck()
        result = {
          test: 'Health Check',
          success: healthy,
          message: healthy ? 'API가 정상 작동 중입니다.' : 'API 연결에 문제가 있습니다.'
        }
        break

      case 'basic':
        const basicTest = await testBasicTextGeneration()
        result = {
          test: 'Basic Text Generation',
          success: basicTest.success,
          result: basicTest.result,
          duration: basicTest.duration,
          error: basicTest.error
        }
        break

      case 'full':
        const fullTest = await runAllTests()
        result = {
          test: 'Full Test Suite',
          overall: fullTest.overall,
          results: fullTest.results
        }
        break

      default:
        return NextResponse.json(
          { error: '지원되지 않는 테스트 타입입니다. (health, basic, full)' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
      success: true
    })

  } catch (error) {
    console.error('AI 테스트 에러:', error)
    
    return NextResponse.json({
      success: false,
      error: 'AI 테스트 실행에 실패했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

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

    // 커스텀 프롬프트 테스트
    const { prompt, options } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: '프롬프트가 필요합니다.' },
        { status: 400 }
      )
    }

    const { generateText } = await import('@/lib/ai')
    
    const startTime = Date.now()
    const result = await generateText(prompt, options)
    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      prompt,
      result,
      duration,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('커스텀 AI 테스트 에러:', error)
    
    return NextResponse.json({
      success: false,
      error: 'AI 테스트 실행에 실패했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
