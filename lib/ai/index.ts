// lib/ai/index.ts
// AI 모듈의 메인 엔트리 포인트
// 모든 AI 관련 기능을 외부에 노출하는 중앙 집중식 인터페이스
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/types.ts, lib/ai/errors.ts

// 클라이언트 및 주요 함수
export { 
  GeminiClient, 
  getGeminiClient, 
  generateText, 
  healthCheck 
} from './gemini-client'

// 타입 정의
export type { 
  AIService, 
  GeminiRequestOptions, 
  GeminiResponse, 
  APIUsageLog, 
  TokenUsage 
} from './types'

// 에러 관련
export { 
  GeminiError, 
  GeminiErrorType, 
  parseGeminiError, 
  isNonRetryableError 
} from './errors'

// 설정 관련
export { 
  getGeminiConfig, 
  getEnvironmentConfig, 
  debugLog 
} from './config'
export type { GeminiConfig } from './config'

// 유틸리티 함수
export { 
  estimateTokens, 
  validateTokenLimit, 
  calculateTokenUsage, 
  withRetry, 
  sleep, 
  logAPIUsage, 
  initializeRateLimiter, 
  checkRateLimit, 
  calculateTimeout, 
  preprocessPrompt 
} from './utils'

// 테스트 함수 (개발환경에서만)
export { 
  testBasicTextGeneration, 
  testHealthCheck, 
  testTokenLimit, 
  runAllTests, 
  testConcurrentRequests 
} from './test'
