// lib/ai/utils.ts
// AI 관련 유틸리티 함수 파일
// 토큰 계산, 재시도 로직, 사용량 로깅 등을 담당
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/types.ts, lib/ai/errors.ts

import { APIUsageLog, TokenUsage } from './types'
import { isNonRetryableError } from './errors'
import { debugLog } from './config'

/**
 * 텍스트의 토큰 수 추정 (대략적)
 * 한글: 1글자 ≈ 1토큰, 영문: 4글자 ≈ 1토큰
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  
  // 한글과 영문을 구분하여 계산
  const koreanChars = (text.match(/[가-힣]/g) || []).length
  const englishChars = text.length - koreanChars
  
  // 한글은 1글자당 1토큰, 영문은 4글자당 1토큰으로 추정
  const koreanTokens = koreanChars
  const englishTokens = Math.ceil(englishChars / 4)
  
  return koreanTokens + englishTokens
}

/**
 * 토큰 제한 검증
 */
export function validateTokenLimit(
  inputTokens: number,
  maxTokens: number = 8192,
  reservedTokens: number = 2000
): boolean {
  return inputTokens <= maxTokens - reservedTokens
}

/**
 * 토큰 사용량 계산
 */
export function calculateTokenUsage(
  inputText: string,
  outputText: string
): TokenUsage {
  const input = estimateTokens(inputText)
  const output = estimateTokens(outputText)
  
  return {
    input,
    output,
    total: input + output
  }
}

/**
 * 재시도 로직 with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseBackoffMs: number = 1000,
  maxBackoffMs: number = 10000
): Promise<T> {
  let lastError: Error = new Error('재시도 실패')
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      debugLog(`재시도 시도 ${attempt}/${maxRetries}`)
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // 재시도 불가능한 에러는 즉시 throw
      if (isNonRetryableError(error)) {
        debugLog('재시도 불가능한 에러 발생', error)
        throw error
      }
      
      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        const backoffMs = Math.min(baseBackoffMs * Math.pow(2, attempt - 1), maxBackoffMs)
        debugLog(`${backoffMs}ms 대기 후 재시도`)
        await sleep(backoffMs)
      }
    }
  }
  
  debugLog('모든 재시도 실패', lastError)
  throw lastError!
}

/**
 * 지연 함수
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * API 사용량 로깅
 */
export function logAPIUsage(log: APIUsageLog): void {
  // 개발 환경에서는 콘솔 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('[Gemini API Usage]', {
      timestamp: log.timestamp.toISOString(),
      model: log.model,
      tokens: `${log.inputTokens}+${log.outputTokens}=${log.inputTokens + log.outputTokens}`,
      latency: `${log.latencyMs}ms`,
      success: log.success,
      error: log.error
    })
  }
  
  // TODO: 프로덕션에서는 실제 로깅 시스템으로 전송
  // 예: 데이터베이스 저장, 외부 로깅 서비스 전송 등
}

/**
 * 레이트 리미터 (간단한 토큰 버킷 구현)
 */
class RateLimiter {
  private tokens: number
  private lastRefill: number
  
  constructor(
    private maxTokens: number,
    private refillRate: number // 분당 토큰 수
  ) {
    this.tokens = maxTokens
    this.lastRefill = Date.now()
  }
  
  /**
   * 요청 허용 여부 확인
   */
  canMakeRequest(): boolean {
    this.refill()
    
    if (this.tokens > 0) {
      this.tokens--
      return true
    }
    
    return false
  }
  
  /**
   * 다음 요청 가능 시간까지의 대기 시간 (ms)
   */
  getWaitTime(): number {
    if (this.tokens > 0) return 0
    
    // 1개 토큰이 충전되는데 필요한 시간
    const msPerToken = (60 * 1000) / this.refillRate
    return msPerToken
  }
  
  /**
   * 토큰 버킷 충전
   */
  private refill(): void {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = Math.floor((timePassed / 1000 / 60) * this.refillRate)
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
      this.lastRefill = now
    }
  }
}

// 전역 레이트 리미터 인스턴스
let globalRateLimiter: RateLimiter | null = null

/**
 * 레이트 리미터 초기화
 */
export function initializeRateLimiter(rateLimitPerMinute: number): void {
  globalRateLimiter = new RateLimiter(rateLimitPerMinute, rateLimitPerMinute)
}

/**
 * 레이트 리미트 검사
 */
export function checkRateLimit(): { allowed: boolean; waitTimeMs: number } {
  if (!globalRateLimiter) {
    throw new Error('레이트 리미터가 초기화되지 않았습니다.')
  }
  
  const allowed = globalRateLimiter.canMakeRequest()
  const waitTimeMs = allowed ? 0 : globalRateLimiter.getWaitTime()
  
  return { allowed, waitTimeMs }
}

/**
 * 텍스트 길이에 따른 적절한 타임아웃 계산
 */
export function calculateTimeout(textLength: number, baseTimeout: number = 10000): number {
  // 텍스트 길이에 비례하여 타임아웃 증가 (최소 10초, 최대 60초)
  const dynamicTimeout = Math.max(baseTimeout, Math.min(60000, textLength * 10))
  return dynamicTimeout
}

/**
 * 프롬프트 전처리 (불필요한 공백 제거, 길이 제한 등)
 */
export function preprocessPrompt(prompt: string, maxLength: number = 10000): string {
  if (!prompt) return ''
  
  // 연속된 공백과 줄바꿈 정리
  let processed = prompt
    .replace(/\s+/g, ' ') // 연속된 공백을 하나로
    .replace(/\n\s*\n/g, '\n') // 연속된 빈 줄을 하나로
    .trim()
  
  // 길이 제한
  if (processed.length > maxLength) {
    processed = processed.substring(0, maxLength) + '...'
    debugLog(`프롬프트가 ${maxLength}자로 잘렸습니다.`)
  }
  
  return processed
}
