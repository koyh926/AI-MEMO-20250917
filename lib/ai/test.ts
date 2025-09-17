// lib/ai/test.ts
// Gemini API 기본 테스트 함수
// API 연결 및 기본 기능 테스트를 위한 유틸리티
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/types.ts, lib/ai/errors.ts

import { GeminiClient, generateText, healthCheck } from './gemini-client'
import { GeminiError } from './errors'
import { debugLog } from './config'

/**
 * 기본 텍스트 생성 테스트
 */
export async function testBasicTextGeneration(): Promise<{
  success: boolean
  result?: string
  error?: string
  duration?: number
}> {
  const startTime = Date.now()
  
  try {
    debugLog('기본 텍스트 생성 테스트 시작')
    
    const testPrompt = '안녕하세요! 간단한 인사말을 한국어로 답변해주세요.'
    const result = await generateText(testPrompt, {
      maxTokens: 100,
      temperature: 0.7
    })
    
    const duration = Date.now() - startTime
    
    debugLog('기본 텍스트 생성 테스트 성공', {
      resultLength: result.length,
      duration
    })
    
    return {
      success: true,
      result,
      duration
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof GeminiError 
      ? error.getUserMessage() 
      : (error as Error).message
    
    debugLog('기본 텍스트 생성 테스트 실패', {
      error: errorMessage,
      duration
    })
    
    return {
      success: false,
      error: errorMessage,
      duration
    }
  }
}

/**
 * 헬스체크 테스트
 */
export async function testHealthCheck(): Promise<{
  success: boolean
  healthy?: boolean
  error?: string
  duration?: number
}> {
  const startTime = Date.now()
  
  try {
    debugLog('헬스체크 테스트 시작')
    
    const healthy = await healthCheck()
    const duration = Date.now() - startTime
    
    debugLog('헬스체크 테스트 완료', {
      healthy,
      duration
    })
    
    return {
      success: true,
      healthy,
      duration
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = (error as Error).message
    
    debugLog('헬스체크 테스트 실패', {
      error: errorMessage,
      duration
    })
    
    return {
      success: false,
      error: errorMessage,
      duration
    }
  }
}

/**
 * 토큰 제한 테스트
 */
export async function testTokenLimit(): Promise<{
  success: boolean
  error?: string
  tokenCount?: number
}> {
  try {
    debugLog('토큰 제한 테스트 시작')
    
    const client = new GeminiClient()
    
    // 매우 긴 텍스트로 토큰 제한 테스트
    const longPrompt = '이것은 토큰 제한을 테스트하기 위한 매우 긴 텍스트입니다. '.repeat(1000)
    const tokenCount = client.estimateTokens(longPrompt)
    
    debugLog('토큰 제한 테스트', {
      promptLength: longPrompt.length,
      estimatedTokens: tokenCount
    })
    
    try {
      await client.generateText(longPrompt)
      // 토큰 제한을 초과했는데 성공하면 문제
      return {
        success: false,
        error: '토큰 제한이 제대로 작동하지 않습니다.',
        tokenCount
      }
    } catch (error) {
      if (error instanceof GeminiError && error.type === 'QUOTA_EXCEEDED') {
        debugLog('토큰 제한 테스트 성공 - 예상된 에러 발생')
        return {
          success: true,
          tokenCount
        }
      } else {
        throw error
      }
    }
    
  } catch (error) {
    const errorMessage = (error as Error).message
    
    debugLog('토큰 제한 테스트 실패', {
      error: errorMessage
    })
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * 전체 테스트 스위트 실행
 */
export async function runAllTests(): Promise<{
  overall: boolean
  results: {
    healthCheck: Awaited<ReturnType<typeof testHealthCheck>>
    basicGeneration: Awaited<ReturnType<typeof testBasicTextGeneration>>
    tokenLimit: Awaited<ReturnType<typeof testTokenLimit>>
  }
}> {
  debugLog('전체 테스트 스위트 시작')
  
  const results = {
    healthCheck: await testHealthCheck(),
    basicGeneration: await testBasicTextGeneration(),
    tokenLimit: await testTokenLimit()
  }
  
  const overall = results.healthCheck.success && 
                  results.basicGeneration.success && 
                  results.tokenLimit.success
  
  debugLog('전체 테스트 스위트 완료', {
    overall,
    healthCheck: results.healthCheck.success,
    basicGeneration: results.basicGeneration.success,
    tokenLimit: results.tokenLimit.success
  })
  
  return {
    overall,
    results
  }
}

/**
 * 성능 테스트 (여러 요청 동시 실행)
 */
export async function testConcurrentRequests(
  requestCount: number = 3
): Promise<{
  success: boolean
  results: Array<{
    success: boolean
    duration: number
    error?: string
  }>
  totalDuration: number
  averageDuration: number
}> {
  debugLog('동시 요청 성능 테스트 시작', { requestCount })
  
  const startTime = Date.now()
  const promises = Array(requestCount).fill(0).map(async (_, index) => {
    const requestStart = Date.now()
    try {
      await generateText(`테스트 요청 ${index + 1}: 간단한 응답을 해주세요.`, {
        maxTokens: 50
      })
      return {
        success: true,
        duration: Date.now() - requestStart
      }
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - requestStart,
        error: (error as Error).message
      }
    }
  })
  
  const results = await Promise.all(promises)
  const totalDuration = Date.now() - startTime
  const successfulResults = results.filter(r => r.success)
  const averageDuration = successfulResults.length > 0 
    ? successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length
    : 0
  
  const success = results.every(r => r.success)
  
  debugLog('동시 요청 성능 테스트 완료', {
    success,
    totalDuration,
    averageDuration,
    successCount: successfulResults.length,
    totalCount: requestCount
  })
  
  return {
    success,
    results,
    totalDuration,
    averageDuration
  }
}
