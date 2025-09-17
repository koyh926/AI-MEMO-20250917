// components/ui/loading-spinner.tsx
// 로딩 상태를 표시하는 스피너 컴포넌트
// 다양한 크기와 색상 옵션을 지원하며 접근성을 고려한 설계
// 관련 파일: components/ai/status-indicator.tsx

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  message?: string
  progress?: number
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  message,
  progress,
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const colorClasses = {
    primary: 'border-blue-500',
    secondary: 'border-gray-500',
    white: 'border-white',
    gray: 'border-gray-400'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* 진행률 표시기 (progress가 있을 때) */}
      {progress !== undefined ? (
        <div className="relative">
          <svg 
            className={cn(sizeClasses[size], 'transform -rotate-90')}
            viewBox="0 0 24 24"
            aria-label={message || '로딩 중'}
          >
            {/* 배경 원 */}
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-200"
            />
            {/* 진행률 원 */}
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 10}`}
              strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
              className={cn('transition-all duration-300', colorClasses[color])}
              strokeLinecap="round"
            />
          </svg>
          {/* 진행률 텍스트 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      ) : (
        /* 기본 스피너 */
        <div
          className={cn(
            sizeClasses[size],
            'animate-spin rounded-full border-2 border-transparent',
            colorClasses[color],
            'border-t-transparent'
          )}
          role="status"
          aria-label={message || '로딩 중'}
        />
      )}

      {/* 로딩 메시지 */}
      {message && (
        <span className="text-sm text-gray-600 animate-pulse">
          {message}
        </span>
      )}

      {/* 스크린 리더용 숨김 텍스트 */}
      <span className="sr-only">
        {message || '로딩 중입니다. 잠시만 기다려주세요.'}
      </span>
    </div>
  )
}
