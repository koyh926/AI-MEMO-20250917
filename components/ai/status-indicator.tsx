// components/ai/status-indicator.tsx
// AI 작업 상태를 시각적으로 표시하는 컴포넌트
// 로딩, 성공, 에러 등 다양한 상태에 대한 UI 제공
// 관련 파일: lib/ai/status-store.tsx, components/ui/loading-spinner.tsx

'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAIStatus } from '@/lib/ai/status-store'
import { AITaskStatus, AITaskType } from '@/lib/ai/status-types'

interface StatusIndicatorProps {
  taskId: string
  type: AITaskType
  size?: 'sm' | 'md' | 'lg'
  showMessage?: boolean
  autoHide?: boolean
  autoHideDelay?: number
  className?: string
}

export function StatusIndicator({
  taskId,
  type,
  size = 'md',
  showMessage = true,
  autoHide = true,
  autoHideDelay = 3000,
  className
}: StatusIndicatorProps) {
  const { getTaskStatus, clearTask } = useAIStatus()
  const [isVisible, setIsVisible] = useState(true)
  const taskState = getTaskStatus(taskId)

  // 성공/에러 상태에서 자동 숨김
  useEffect(() => {
    if (autoHide && taskState && 
        (taskState.status === AITaskStatus.SUCCESS || 
         taskState.status === AITaskStatus.ERROR ||
         taskState.status === AITaskStatus.TIMEOUT)) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        clearTask(taskId)
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [taskState, autoHide, autoHideDelay, taskId, clearTask])

  if (!taskState || !isVisible) {
    return null
  }

  const getStatusIcon = () => {
    switch (taskState.status) {
      case AITaskStatus.LOADING:
        return (
          <LoadingSpinner 
            size={size} 
            color="primary" 
            progress={taskState.progress}
          />
        )
      case AITaskStatus.SUCCESS:
        return (
          <CheckCircle 
            className={cn(
              'text-green-500 animate-bounce',
              size === 'sm' && 'w-4 h-4',
              size === 'md' && 'w-5 h-5',
              size === 'lg' && 'w-6 h-6'
            )} 
          />
        )
      case AITaskStatus.ERROR:
        return (
          <XCircle 
            className={cn(
              'text-red-500 animate-shake',
              size === 'sm' && 'w-4 h-4',
              size === 'md' && 'w-5 h-5',
              size === 'lg' && 'w-6 h-6'
            )} 
          />
        )
      case AITaskStatus.TIMEOUT:
        return (
          <Clock 
            className={cn(
              'text-yellow-500',
              size === 'sm' && 'w-4 h-4',
              size === 'md' && 'w-5 h-5',
              size === 'lg' && 'w-6 h-6'
            )} 
          />
        )
      case AITaskStatus.CANCELLED:
        return (
          <AlertTriangle 
            className={cn(
              'text-gray-500',
              size === 'sm' && 'w-4 h-4',
              size === 'md' && 'w-5 h-5',
              size === 'lg' && 'w-6 h-6'
            )} 
          />
        )
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    if (taskState.message) {
      return taskState.message
    }

    const typeLabel = type === AITaskType.SUMMARY ? '요약' : '태그'
    
    switch (taskState.status) {
      case AITaskStatus.LOADING:
        return `AI ${typeLabel} 생성 중...`
      case AITaskStatus.SUCCESS:
        return `${typeLabel} 생성 완료!`
      case AITaskStatus.ERROR:
        return taskState.error || `${typeLabel} 생성 실패`
      case AITaskStatus.TIMEOUT:
        return `${typeLabel} 생성 시간 초과`
      case AITaskStatus.CANCELLED:
        return `${typeLabel} 생성 취소됨`
      default:
        return ''
    }
  }

  const getStatusColor = () => {
    switch (taskState.status) {
      case AITaskStatus.LOADING:
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case AITaskStatus.SUCCESS:
        return 'text-green-600 bg-green-50 border-green-200'
      case AITaskStatus.ERROR:
        return 'text-red-600 bg-red-50 border-red-200'
      case AITaskStatus.TIMEOUT:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case AITaskStatus.CANCELLED:
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getAriaLabel = () => {
    const typeLabel = type === AITaskType.SUMMARY ? '요약' : '태그'
    const statusLabel = {
      [AITaskStatus.IDLE]: '대기 중',
      [AITaskStatus.LOADING]: '생성 중',
      [AITaskStatus.SUCCESS]: '생성 완료',
      [AITaskStatus.ERROR]: '생성 실패',
      [AITaskStatus.TIMEOUT]: '시간 초과',
      [AITaskStatus.CANCELLED]: '취소됨'
    }[taskState.status] || '알 수 없음'

    return `AI ${typeLabel} ${statusLabel}`
  }

  return (
    <div 
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300',
        getStatusColor(),
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={getAriaLabel()}
    >
      {getStatusIcon()}
      
      {showMessage && (
        <span className={cn(
          'font-medium',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}>
          {getStatusMessage()}
        </span>
      )}

      {/* 진행률 표시 (로딩 중일 때만) */}
      {taskState.status === AITaskStatus.LOADING && taskState.progress && (
        <span className="text-xs text-gray-500 ml-auto">
          {Math.round(taskState.progress)}%
        </span>
      )}
    </div>
  )
}
