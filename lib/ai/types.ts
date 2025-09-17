// lib/ai/types.ts
// AI 관련 타입 정의 파일
// Gemini API 요청/응답 타입과 에러 타입을 정의
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/errors.ts, lib/ai/config.ts

/**
 * Gemini API 요청 옵션
 */
export interface GeminiRequestOptions {
  prompt: string
  maxTokens?: number
  temperature?: number
  topP?: number
  topK?: number
}

/**
 * Gemini API 응답 타입
 */
export interface GeminiResponse {
  text: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model: string
  finishReason?: string
  timestamp?: string
}

/**
 * AI 서비스 공통 인터페이스
 */
export interface AIService {
  generateText(prompt: string, options?: Partial<GeminiRequestOptions>): Promise<string>
  healthCheck(): Promise<boolean>
  estimateTokens(text: string): number
}

/**
 * API 사용량 로그 타입
 */
export interface APIUsageLog {
  timestamp: Date
  model: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  success: boolean
  error?: string
}

/**
 * 토큰 사용량 정보
 */
export interface TokenUsage {
  input: number
  output: number
  total: number
}
