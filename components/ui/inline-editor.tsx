// components/ui/inline-editor.tsx
// 인라인 편집 컴포넌트 - 클릭하여 편집 모드로 전환하고 실시간으로 저장
// 요약, 태그 등 텍스트 내용을 직접 편집할 수 있는 재사용 가능한 컴포넌트
// 관련 파일: components/notes/summary-generator.tsx, components/notes/tags-generator.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Check, X, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineEditorProps {
  value: string
  onSave: (newValue: string) => Promise<void> | void
  placeholder?: string
  multiline?: boolean
  className?: string
  disabled?: boolean
  maxLength?: number
}

export function InlineEditor({
  value,
  onSave,
  placeholder = '클릭하여 편집하세요',
  multiline = false,
  className,
  disabled = false,
  maxLength
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 편집 모드 진입 시 자동 포커스 및 텍스트 선택
  useEffect(() => {
    if (isEditing) {
      const element = multiline ? textareaRef.current : inputRef.current
      if (element) {
        element.focus()
        element.select()
      }
    }
  }, [isEditing, multiline])

  // 외부 value 변경 시 내부 상태 동기화
  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleStartEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setEditValue(value)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
    setError(null)
  }

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false)
      return
    }

    if (maxLength && editValue.length > maxLength) {
      setError(`최대 ${maxLength}자까지 입력할 수 있습니다.`)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(editValue.trim())
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Enter' && multiline && e.metaKey) {
      e.preventDefault()
      handleSave()
    }
  }

  const handleBlur = () => {
    // 약간의 지연을 두어 버튼 클릭이 먼저 처리되도록 함
    setTimeout(() => {
      if (isEditing && !isSaving) {
        handleSave()
      }
    }, 100)
  }

  if (isEditing) {
    return (
      <div className={cn('space-y-2', className)}>
        {multiline ? (
          <Textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={isSaving}
            className="min-h-[100px] resize-none"
            maxLength={maxLength}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={maxLength}
          />
        )}
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8"
          >
            <Check className="w-4 h-4" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8"
          >
            <X className="w-4 h-4" />
            취소
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group cursor-pointer rounded-md p-2 hover:bg-gray-50 transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleStartEdit}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {value ? (
            <div className="whitespace-pre-wrap text-sm text-gray-700">
              {value}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">
              {placeholder}
            </div>
          )}
        </div>
        <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
      </div>
    </div>
  )
}
