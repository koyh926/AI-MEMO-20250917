// lib/ai/config.ts
// Gemini API 설정 관리 파일
// 환경변수를 통한 설정과 환경별 분리를 담당
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/types.ts, .env.local

/**
 * Gemini 설정 인터페이스
 */
export interface GeminiConfig {
  apiKey: string
  model: string
  maxTokens: number
  timeout: number
  debug: boolean
  rateLimitPerMinute: number
  temperature: number
  topP: number
  topK: number
}

/**
 * 기본 설정값
 */
const DEFAULT_CONFIG: Omit<GeminiConfig, 'apiKey'> = {
  model: 'gemini-2.0-flash-001',
  maxTokens: 8192,
  timeout: 10000, // 10초
  debug: false,
  rateLimitPerMinute: 60,
  temperature: 0.7,
  topP: 0.8,
  topK: 40
}

/**
 * 환경변수에서 Gemini 설정을 가져오기
 */
export function getGeminiConfig(): GeminiConfig {
  // 필수 환경변수 확인
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')
  }

  const config: GeminiConfig = {
    apiKey,
    model: process.env.GEMINI_MODEL || DEFAULT_CONFIG.model,
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || DEFAULT_CONFIG.maxTokens.toString()),
    timeout: parseInt(process.env.GEMINI_TIMEOUT_MS || DEFAULT_CONFIG.timeout.toString()),
    debug: process.env.GEMINI_DEBUG === 'true' || process.env.NODE_ENV === 'development',
    rateLimitPerMinute: parseInt(process.env.GEMINI_RATE_LIMIT || DEFAULT_CONFIG.rateLimitPerMinute.toString()),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || DEFAULT_CONFIG.temperature.toString()),
    topP: parseFloat(process.env.GEMINI_TOP_P || DEFAULT_CONFIG.topP.toString()),
    topK: parseInt(process.env.GEMINI_TOP_K || DEFAULT_CONFIG.topK.toString())
  }

  // 설정값 유효성 검사
  validateConfig(config)

  return config
}

/**
 * 설정값 유효성 검사
 */
function validateConfig(config: GeminiConfig): void {
  if (config.maxTokens <= 0 || config.maxTokens > 32768) {
    throw new Error('GEMINI_MAX_TOKENS는 1-32768 사이의 값이어야 합니다.')
  }

  if (config.timeout <= 0 || config.timeout > 60000) {
    throw new Error('GEMINI_TIMEOUT_MS는 1-60000 사이의 값이어야 합니다.')
  }

  if (config.temperature < 0 || config.temperature > 2) {
    throw new Error('GEMINI_TEMPERATURE는 0-2 사이의 값이어야 합니다.')
  }

  if (config.topP < 0 || config.topP > 1) {
    throw new Error('GEMINI_TOP_P는 0-1 사이의 값이어야 합니다.')
  }

  if (config.topK <= 0 || config.topK > 100) {
    throw new Error('GEMINI_TOP_K는 1-100 사이의 값이어야 합니다.')
  }

  if (config.rateLimitPerMinute <= 0) {
    throw new Error('GEMINI_RATE_LIMIT는 양수여야 합니다.')
  }
}

/**
 * 환경별 설정 오버라이드
 */
export function getEnvironmentConfig(): Partial<GeminiConfig> {
  const env = process.env.NODE_ENV

  switch (env) {
    case 'development':
      return {
        debug: true,
        timeout: 30000, // 개발환경에서는 더 긴 타임아웃
        rateLimitPerMinute: 30 // 개발환경에서는 더 낮은 제한
      }
    
    case 'test':
      return {
        debug: false,
        timeout: 5000, // 테스트에서는 짧은 타임아웃
        rateLimitPerMinute: 10
      }
    
    case 'production':
      return {
        debug: false,
        timeout: 10000,
        rateLimitPerMinute: 60
      }
    
    default:
      return {}
  }
}

/**
 * 디버그 로그 출력 (개발환경에서만)
 */
export function debugLog(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === 'development' || process.env.GEMINI_DEBUG === 'true') {
    console.log(`[Gemini Debug] ${message}`, data || '')
  }
}
