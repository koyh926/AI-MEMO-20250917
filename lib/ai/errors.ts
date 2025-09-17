// lib/ai/errors.ts
// AI 관련 에러 정의 파일
// Gemini API 에러 타입과 처리를 담당
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/types.ts, lib/ai/utils.ts

/**
 * Gemini API 에러 타입 열거형
 */
export enum GeminiErrorType {
  API_KEY_INVALID = 'API_KEY_INVALID',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Gemini API 커스텀 에러 클래스
 */
export class GeminiError extends Error {
  constructor(
    public type: GeminiErrorType,
    message: string,
    public originalError?: unknown,
    public retryAfter?: number
  ) {
    super(message)
    this.name = 'GeminiError'
  }

  /**
   * 재시도 가능한 에러인지 확인
   */
  isRetryable(): boolean {
    const retryableTypes = [
      GeminiErrorType.NETWORK_ERROR,
      GeminiErrorType.TIMEOUT,
      GeminiErrorType.RATE_LIMIT
    ]
    return retryableTypes.includes(this.type)
  }

  /**
   * 사용자에게 표시할 메시지 생성
   */
  getUserMessage(): string {
    switch (this.type) {
      case GeminiErrorType.API_KEY_INVALID:
        return 'AI 서비스 인증에 실패했습니다. 관리자에게 문의하세요.'
      case GeminiErrorType.QUOTA_EXCEEDED:
        return 'AI 서비스 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.'
      case GeminiErrorType.TIMEOUT:
        return '요청 시간이 초과되었습니다. 다시 시도해주세요.'
      case GeminiErrorType.CONTENT_FILTERED:
        return '요청 내용이 필터링되었습니다. 다른 내용으로 시도해주세요.'
      case GeminiErrorType.NETWORK_ERROR:
        return '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.'
      case GeminiErrorType.RATE_LIMIT:
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      case GeminiErrorType.INVALID_REQUEST:
        return '잘못된 요청입니다. 다시 시도해주세요.'
      default:
        return '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'
    }
  }
}

/**
 * 원본 에러를 Gemini 에러로 변환
 */
export function parseGeminiError(error: unknown): GeminiError {
  if (error instanceof GeminiError) {
    return error
  }

  // Google AI SDK 에러 처리
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: number }).code
    const message = (error as { message?: string }).message || ''
    
    switch (code) {
      case 400:
        return new GeminiError(
          GeminiErrorType.INVALID_REQUEST,
          '잘못된 요청입니다: ' + message,
          error
        )
      case 401:
      case 403:
        return new GeminiError(
          GeminiErrorType.API_KEY_INVALID,
          'API 키가 유효하지 않습니다: ' + message,
          error
        )
      case 429:
        return new GeminiError(
          GeminiErrorType.RATE_LIMIT,
          '요청 한도를 초과했습니다: ' + message,
          error
        )
      case 500:
      case 502:
      case 503:
        return new GeminiError(
          GeminiErrorType.NETWORK_ERROR,
          '서버 오류가 발생했습니다: ' + message,
          error
        )
    }
  }

  // HTTP 상태 코드 기반 에러 분류
  if (error && typeof error === 'object' && 'status' in error) {
    switch (error.status) {
      case 401:
      case 403:
        return new GeminiError(
          GeminiErrorType.API_KEY_INVALID,
          'API 키가 유효하지 않습니다.',
          error
        )
      case 429:
        const retryAfter = error && typeof error === 'object' && 'headers' in error 
          ? (error.headers as Record<string, string>)?.['retry-after'] 
          : undefined
        return new GeminiError(
          GeminiErrorType.RATE_LIMIT,
          '요청 한도를 초과했습니다.',
          error,
          retryAfter ? parseInt(retryAfter) : undefined
        )
      case 400:
        return new GeminiError(
          GeminiErrorType.INVALID_REQUEST,
          '잘못된 요청입니다.',
          error
        )
      case 413:
        return new GeminiError(
          GeminiErrorType.QUOTA_EXCEEDED,
          '요청 크기가 너무 큽니다.',
          error
        )
    }
  }

  // 에러 메시지 기반 분류
  const message = (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') 
    ? error.message.toLowerCase() 
    : ''
  
  if (message.includes('timeout') || message.includes('시간 초과')) {
    return new GeminiError(GeminiErrorType.TIMEOUT, '요청 시간이 초과되었습니다.', error)
  }
  
  if (message.includes('network') || message.includes('연결') || message.includes('fetch')) {
    return new GeminiError(GeminiErrorType.NETWORK_ERROR, '네트워크 연결에 실패했습니다.', error)
  }
  
  if (message.includes('filtered') || message.includes('blocked') || message.includes('safety')) {
    return new GeminiError(GeminiErrorType.CONTENT_FILTERED, '콘텐츠가 필터링되었습니다.', error)
  }

  if (message.includes('quota') || message.includes('limit') || message.includes('exceeded')) {
    return new GeminiError(GeminiErrorType.QUOTA_EXCEEDED, '사용량 한도를 초과했습니다.', error)
  }

  // 기본 에러
  return new GeminiError(
    GeminiErrorType.UNKNOWN,
    (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') 
      ? error.message 
      : '알 수 없는 오류가 발생했습니다.',
    error
  )
}

/**
 * 재시도 불가능한 에러인지 확인
 */
export function isNonRetryableError(error: unknown): boolean {
  const geminiError = error instanceof GeminiError ? error : parseGeminiError(error)
  return !geminiError.isRetryable()
}
