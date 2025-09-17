// lib/ai/gemini-client.ts
// Google Gemini API 클라이언트 구현
// AI 서비스의 핵심 기능을 담당하며 에러 처리와 재시도 로직을 포함
// 관련 파일: lib/ai/types.ts, lib/ai/errors.ts, lib/ai/config.ts, lib/ai/utils.ts

import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIService, GeminiRequestOptions, GeminiResponse } from './types'
import { GeminiError, GeminiErrorType, parseGeminiError } from './errors'
import { getGeminiConfig, debugLog } from './config'
import { 
  estimateTokens, 
  validateTokenLimit, 
  withRetry, 
  logAPIUsage,
  initializeRateLimiter,
  checkRateLimit,
  calculateTimeout,
  preprocessPrompt
} from './utils'

/**
 * Google Gemini API 클라이언트 클래스
 */
export class GeminiClient implements AIService {
  private client: GoogleGenerativeAI
  private config: ReturnType<typeof getGeminiConfig>
  private isInitialized = false

  constructor() {
    // 설정 로드 및 검증
    this.config = getGeminiConfig()
    
    // Gemini 클라이언트 초기화
    this.client = new GoogleGenerativeAI(this.config.apiKey)

    // 레이트 리미터 초기화
    initializeRateLimiter(this.config.rateLimitPerMinute)
    
    this.isInitialized = true
    debugLog('Gemini 클라이언트 초기화 완료', {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      timeout: this.config.timeout
    })
  }

  /**
   * 텍스트 생성 (기본 메서드)
   */
  async generateText(
    prompt: string, 
    options?: Partial<GeminiRequestOptions>
  ): Promise<string> {
    this.ensureInitialized()
    
    // 프롬프트 전처리
    const processedPrompt = preprocessPrompt(prompt)
    if (!processedPrompt) {
      throw new GeminiError(GeminiErrorType.INVALID_REQUEST, '빈 프롬프트는 허용되지 않습니다.')
    }

    // 토큰 수 확인
    const inputTokens = this.estimateTokens(processedPrompt)
    if (!validateTokenLimit(inputTokens, this.config.maxTokens)) {
      throw new GeminiError(
        GeminiErrorType.QUOTA_EXCEEDED, 
        `입력 토큰 수(${inputTokens})가 제한(${this.config.maxTokens})을 초과했습니다.`
      )
    }

    // 레이트 리미트 확인
    const rateLimit = checkRateLimit()
    if (!rateLimit.allowed) {
      throw new GeminiError(
        GeminiErrorType.RATE_LIMIT,
        `레이트 리미트 초과. ${Math.ceil(rateLimit.waitTimeMs / 1000)}초 후 다시 시도하세요.`,
        undefined,
        rateLimit.waitTimeMs
      )
    }

    const startTime = Date.now()
    let response: GeminiResponse | null = null

    try {
      // 재시도 로직과 함께 API 호출
      response = await withRetry(
        () => this.callGeminiAPI(processedPrompt, options),
        3, // 최대 3회 재시도
        1000 // 1초 기본 백오프
      )

      const latencyMs = Date.now() - startTime
      
      // 사용량 로깅
      logAPIUsage({
        timestamp: new Date(),
        model: response.model,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        latencyMs,
        success: true
      })

      debugLog('텍스트 생성 성공', {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        latencyMs
      })

      return response.text

    } catch (error) {
      const latencyMs = Date.now() - startTime
      const geminiError = parseGeminiError(error)
      
      // 실패 로깅
      logAPIUsage({
        timestamp: new Date(),
        model: this.config.model,
        inputTokens,
        outputTokens: 0,
        latencyMs,
        success: false,
        error: geminiError.message
      })

      debugLog('텍스트 생성 실패', {
        error: geminiError.message,
        type: geminiError.type,
        latencyMs
      })

      throw geminiError
    }
  }

  /**
   * 헬스체크 - API 연결 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      debugLog('헬스체크 시작')
      
      // 간단한 텍스트 생성으로 연결 확인
      const result = await this.generateText('Hello', {
        maxTokens: 10
      })
      
      const isHealthy = !!result && result.length > 0
      debugLog('헬스체크 결과', { healthy: isHealthy })
      
      return isHealthy
    } catch (error) {
      debugLog('헬스체크 실패', error)
      return false
    }
  }

  /**
   * 토큰 수 추정
   */
  estimateTokens(text: string): number {
    return estimateTokens(text)
  }

  /**
   * 실제 Gemini API 호출
   */
  private async callGeminiAPI(
    prompt: string,
    options?: Partial<GeminiRequestOptions>
  ): Promise<GeminiResponse> {
    const timeout = calculateTimeout(prompt.length, this.config.timeout)
    
    // 타임아웃 Promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new GeminiError(GeminiErrorType.TIMEOUT, `요청이 ${timeout}ms 후 타임아웃되었습니다.`))
      }, timeout)
    })

    // API 호출 Promise
    const apiPromise = this.makeAPIRequest(prompt, options)

    try {
      // 타임아웃과 API 호출 중 먼저 완료되는 것 반환
      return await Promise.race([apiPromise, timeoutPromise])
    } catch (error) {
      throw parseGeminiError(error)
    }
  }

  /**
   * 실제 API 요청 수행
   */
  private async makeAPIRequest(
    prompt: string,
    options?: Partial<GeminiRequestOptions>
  ): Promise<GeminiResponse> {
    try {
      debugLog('API 요청 시작', {
        model: this.config.model,
        promptLength: prompt.length,
        estimatedTokens: estimateTokens(prompt)
      })

      // Gemini API 모델 가져오기
      const model = this.client.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: options?.maxTokens || this.config.maxTokens,
          temperature: options?.temperature || this.config.temperature,
          topP: this.config.topP,
          topK: this.config.topK,
        }
      })

      // 실제 Gemini API 호출
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      if (!text) {
        throw new GeminiError(GeminiErrorType.UNKNOWN, '생성된 텍스트가 비어있습니다.')
      }

      // 사용량 정보 계산 (Gemini API는 정확한 토큰 수를 제공하지 않으므로 추정)
      const inputTokens = estimateTokens(prompt)
      const outputTokens = estimateTokens(text)

      debugLog('API 요청 성공', {
        inputTokens,
        outputTokens,
        textLength: text.length
      })

      return {
        text,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens
        },
        model: this.config.model,
        finishReason: 'STOP',
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      debugLog('API 요청 실패', error)
      throw error
    }
  }

  /**
   * 클라이언트 초기화 확인
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Gemini 클라이언트가 초기화되지 않았습니다.')
    }
  }

  /**
   * 현재 설정 정보 반환
   */
  getConfig(): Readonly<ReturnType<typeof getGeminiConfig>> {
    return { ...this.config }
  }

  /**
   * 클라이언트 상태 정보
   */
  getStatus(): {
    initialized: boolean
    model: string
    maxTokens: number
    timeout: number
  } {
    return {
      initialized: this.isInitialized,
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      timeout: this.config.timeout
    }
  }
}

// 싱글톤 인스턴스 (선택적)
let geminiClientInstance: GeminiClient | null = null

/**
 * 싱글톤 Gemini 클라이언트 인스턴스 반환
 */
export function getGeminiClient(): GeminiClient {
  if (!geminiClientInstance) {
    geminiClientInstance = new GeminiClient()
  }
  return geminiClientInstance
}

/**
 * 기본 텍스트 생성 함수 (편의용)
 */
export async function generateText(
  prompt: string,
  options?: Partial<GeminiRequestOptions>
): Promise<string> {
  const client = getGeminiClient()
  return client.generateText(prompt, options)
}

/**
 * 기본 헬스체크 함수 (편의용)
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = getGeminiClient()
    return await client.healthCheck()
  } catch (error) {
    debugLog('헬스체크 에러', error)
    return false
  }
}
