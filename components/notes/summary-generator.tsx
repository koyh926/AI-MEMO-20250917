// components/notes/summary-generator.tsx
// 노트 요약 생성 컴포넌트 - AI를 사용하여 노트 내용을 자동으로 요약
// 요약 생성, 편집, 재생성 기능을 제공하며 로딩 상태와 에러 처리 포함
// 관련 파일: app/api/notes/generate-summary/route.ts, components/notes/note-form.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
// import { Textarea } from '@/components/ui/textarea' // 사용하지 않음
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react'
import { StatusIndicator } from '@/components/ai/status-indicator'
import { useAIStatus } from '@/lib/ai/status-store'
import { AITaskType, AITaskStatus } from '@/lib/ai/status-types'
import { InlineEditor } from '@/components/ui/inline-editor'

interface SummaryGeneratorProps {
  noteId: string
  content: string
  existingSummary?: string
  onSummaryGenerated?: (summary: string) => void
  className?: string
}

export function SummaryGenerator({
  noteId,
  content,
  existingSummary,
  onSummaryGenerated,
  className
}: SummaryGeneratorProps) {
  const { createTask, setTaskStatus } = useAIStatus()
  const [isGenerating, setIsGenerating] = useState(false)
  const [summary, setSummary] = useState(existingSummary || '')
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(
    existingSummary ? new Date() : null
  )
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

  // 요약 생성 가능 여부 확인
  const canGenerate = content.length >= 100 && !isGenerating
  const hasExistingSummary = !!existingSummary || !!summary

  // 요약 생성 함수
  const generateSummary = async () => {
    if (!canGenerate) return

    // 새 작업 생성
    const taskId = createTask(AITaskType.SUMMARY, `summary-${noteId}`)
    setCurrentTaskId(taskId)
    
    setIsGenerating(true)
    setError(null)

    // 로딩 상태로 설정
    setTaskStatus(taskId, {
      status: AITaskStatus.LOADING,
      message: 'AI 요약을 생성하고 있습니다...'
    })

    try {
      const response = await fetch('/api/notes/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, content })
      })

      const result = await response.json()

      if (result.success) {
        setSummary(result.summary)
        setLastGenerated(new Date(result.generatedAt))
        onSummaryGenerated?.(result.summary)
        
        // 성공 상태로 설정
        setTaskStatus(taskId, {
          status: AITaskStatus.SUCCESS,
          message: '요약 생성이 완료되었습니다!',
          result: result.summary
        })
      } else {
        const errorMessage = result.error || '요약 생성에 실패했습니다.'
        setError(errorMessage)
        
        // 에러 상태로 설정
        setTaskStatus(taskId, {
          status: AITaskStatus.ERROR,
          error: errorMessage
        })
      }
    } catch (error) {
      console.error('요약 생성 에러:', error)
      const errorMessage = '네트워크 오류가 발생했습니다. 다시 시도해주세요.'
      setError(errorMessage)
      
      // 에러 상태로 설정
      if (taskId) {
        setTaskStatus(taskId, {
          status: AITaskStatus.ERROR,
          error: errorMessage
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // 요약 내용 변경 핸들러 (사용하지 않음 - InlineEditor에서 직접 처리)
  // const handleSummaryChange = (value: string) => {
  //   setSummary(value)
  //   onSummaryGenerated?.(value)
  // }

  // 요약 수정 핸들러
  const handleSummaryEdit = async (newSummary: string) => {
    try {
      const response = await fetch('/api/notes/update-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, summary: newSummary })
      })

      const result = await response.json()

      if (result.success) {
        setSummary(newSummary)
        onSummaryGenerated?.(newSummary)
      } else {
        throw new Error(result.error || '요약 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('요약 수정 에러:', error)
      throw error
    }
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <Label className="text-base font-medium">AI 요약</Label>
          {lastGenerated && (
            <span className="text-xs text-muted-foreground">
              {lastGenerated.toLocaleString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={generateSummary}
            disabled={!canGenerate}
            size="sm"
            variant={hasExistingSummary ? "outline" : "default"}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                요약 생성 중...
              </>
            ) : (
              <>
                {hasExistingSummary ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    재생성
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    요약 생성
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 상태 표시기 */}
      {currentTaskId && (
        <StatusIndicator
          taskId={currentTaskId}
          type={AITaskType.SUMMARY}
          size="md"
          showMessage={true}
          autoHide={true}
          className="animate-fade-in"
        />
      )}

      {/* 에러 메시지 (상태 표시기와 별도) */}
      {error && !currentTaskId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 내용 길이 안내 */}
      {content.length < 100 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            요약 생성을 위해서는 최소 100자 이상의 내용이 필요합니다. 
            현재: {content.length}자
          </AlertDescription>
        </Alert>
      )}

      {/* 요약 표시 및 편집 영역 */}
      {summary && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">AI 요약</Label>
          <InlineEditor
            value={summary}
            onSave={handleSummaryEdit}
            placeholder="요약을 클릭하여 편집하세요"
            multiline={true}
            className="min-h-[120px] border border-gray-200 rounded-md"
            maxLength={1000}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>클릭하여 직접 편집할 수 있습니다</span>
            <span>{summary.length}/1000자</span>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {isGenerating && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-sm text-muted-foreground">
              AI가 노트 내용을 분석하고 요약을 생성하고 있습니다...
            </p>
            <p className="text-xs text-muted-foreground">
              최대 15초 소요됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 도움말 */}
      {!summary && !isGenerating && canGenerate && (
        <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
            <div className="text-sm text-purple-700">
              <p className="font-medium mb-1">AI 요약 기능</p>
              <p>노트 내용을 3-6개의 핵심 포인트로 자동 요약합니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
