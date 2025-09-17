// components/notes/tags-generator.tsx
// 노트 태그 자동 생성 UI 컴포넌트 - AI 기반 태그 생성 및 편집 기능 제공
// 태그 생성, 편집, 재생성 기능과 로딩 상태 관리를 담당
// 관련 파일: app/api/notes/generate-tags/route.ts, components/notes/note-form.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw, X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { StatusIndicator } from '@/components/ai/status-indicator'
import { useAIStatus } from '@/lib/ai/status-store'
import { AITaskType, AITaskStatus } from '@/lib/ai/status-types'

interface TagsGeneratorProps {
  noteId?: string
  title?: string
  content: string
  existingTags?: string[]
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
}

export function TagsGenerator({
  noteId,
  title,
  content,
  existingTags = [],
  onTagsChange,
  disabled = false
}: TagsGeneratorProps) {
  const { createTask, setTaskStatus } = useAIStatus()
  const [tags, setTags] = useState<string[]>(existingTags)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [newTagInput, setNewTagInput] = useState('')
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

  const canGenerate = content.trim().length >= 50

  const generateTags = async () => {
    if (!canGenerate || disabled) return

    // 새 작업 생성
    const taskId = createTask(AITaskType.TAGS, `tags-${noteId}`)
    setCurrentTaskId(taskId)

    setIsGenerating(true)
    setError(null)

    // 로딩 상태로 설정
    setTaskStatus(taskId, {
      status: AITaskStatus.LOADING,
      message: 'AI 태그를 생성하고 있습니다...'
    })

    try {
      const response = await fetch('/api/notes/generate-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteId,
          title,
          content
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '태그 생성에 실패했습니다.')
      }

      const newTags = data.tags || []
      setTags(newTags)
      onTagsChange(newTags)

      // 성공 상태로 설정
      setTaskStatus(taskId, {
        status: AITaskStatus.SUCCESS,
        message: '태그 생성이 완료되었습니다!',
        result: newTags
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '태그 생성에 실패했습니다.'
      setError(errorMessage)
      
      // 에러 상태로 설정
      setTaskStatus(taskId, {
        status: AITaskStatus.ERROR,
        error: errorMessage
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    setTags(newTags)
    onTagsChange(newTags)
  }

  const startEditing = (index: number) => {
    setEditingIndex(index)
    setEditingValue(tags[index])
  }

  const saveEdit = () => {
    if (editingIndex !== null && editingValue.trim()) {
      const newTags = [...tags]
      newTags[editingIndex] = editingValue.trim()
      setTags(newTags)
      onTagsChange(newTags)
    }
    setEditingIndex(null)
    setEditingValue('')
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditingValue('')
  }

  const addNewTag = () => {
    const trimmedTag = newTagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 6) {
      const newTags = [...tags, trimmedTag]
      setTags(newTags)
      onTagsChange(newTags)
      setNewTagInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingIndex !== null) {
        saveEdit()
      } else {
        addNewTag()
      }
    } else if (e.key === 'Escape') {
      if (editingIndex !== null) {
        cancelEdit()
      } else {
        setNewTagInput('')
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* 태그 생성 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            checked={autoGenerateEnabled}
            onCheckedChange={setAutoGenerateEnabled}
            disabled={disabled}
          />
          <span className="text-sm text-gray-600">자동 태그 생성</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {!canGenerate && (
            <span className="text-xs text-gray-500">
              최소 50자 이상 입력하세요
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={generateTags}
            disabled={!canGenerate || isGenerating || disabled}
            className="flex items-center space-x-1"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{tags.length > 0 ? '재생성' : '생성'}</span>
          </Button>
        </div>
      </div>

      {/* 상태 표시기 */}
      {currentTaskId && (
        <StatusIndicator
          taskId={currentTaskId}
          type={AITaskType.TAGS}
          size="md"
          showMessage={true}
          autoHide={true}
          className="animate-fade-in"
        />
      )}

      {/* 에러 메시지 (상태 표시기와 별도) */}
      {error && !currentTaskId && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 태그 표시 및 편집 */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">태그</span>
            <span className="text-xs text-gray-500">{tags.length}/6</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <div
                key={index}
                className="flex items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1"
              >
                {editingIndex === index ? (
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={saveEdit}
                    className="w-16 h-6 text-xs border-none bg-transparent p-0 focus:ring-0"
                    autoFocus
                    disabled={disabled}
                  />
                ) : (
                  <span
                    className="text-sm text-blue-700 cursor-pointer hover:text-blue-900"
                    onClick={() => !disabled && startEditing(index)}
                  >
                    {tag}
                  </span>
                )}
                
                {!disabled && (
                  <button
                    onClick={() => removeTag(index)}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 새 태그 추가 */}
      {!disabled && tags.length < 6 && (
        <div className="flex items-center space-x-2">
          <Input
            placeholder="새 태그 추가..."
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 h-8 text-sm"
            maxLength={8}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={addNewTag}
            disabled={!newTagInput.trim() || tags.includes(newTagInput.trim())}
            className="h-8 px-2"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* 로딩 상태 */}
      {isGenerating && (
        <div className="flex items-center justify-center py-4 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          AI가 태그를 생성하고 있습니다...
        </div>
      )}
    </div>
  )
}
