// components/notes/note-form.tsx
// 노트 작성 폼 컴포넌트 - 새로운 노트 생성을 위한 폼 UI
// 제목과 본문 입력 필드, 저장/취소 버튼을 포함한 완전한 노트 작성 인터페이스
// 관련 파일: lib/notes/actions.ts, app/notes/new/page.tsx, components/ui/textarea.tsx

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { createNoteAction } from '@/lib/notes/actions'
import { SummaryGenerator } from './summary-generator'
import { TagsGenerator } from './tags-generator'

export function NoteForm() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [enableSummary, setEnableSummary] = useState(true)
    const [enableTags, setEnableTags] = useState(true)
    const [createdNoteId, setCreatedNoteId] = useState<string | null>(null)
    const [showTagsStep, setShowTagsStep] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        const formData = new FormData()
        formData.append('title', title)
        formData.append('content', content)

        startTransition(async () => {
            const result = await createNoteAction(formData)
            
            if (result.success && result.noteId) {
                setCreatedNoteId(result.noteId)
                // AI 기능이 비활성화되어 있거나 내용이 충분하지 않으면 바로 완료
                const shouldShowSummary = enableSummary && content.length >= 100
                const shouldShowTags = enableTags && content.length >= 50
                
                if (!shouldShowSummary && !shouldShowTags) {
                    router.push('/notes')
                } else if (!shouldShowSummary && shouldShowTags) {
                    setShowTagsStep(true)
                }
                // shouldShowSummary가 true이면 기본적으로 요약 단계 표시
            } else {
                setError(result.error || '노트 저장에 실패했습니다.')
            }
        })
    }

    const handleCancel = () => {
        router.push('/notes')
    }

    const handleSummaryGenerated = (generatedSummary: string) => {
        console.log('요약 생성됨:', generatedSummary)
    }

    const handleTagsGenerated = (generatedTags: string[]) => {
        console.log('태그 생성됨:', generatedTags)
    }

    const handleSummaryNext = () => {
        if (enableTags && content.length >= 50) {
            setShowTagsStep(true)
        } else {
            router.push('/notes')
        }
    }

    const handleFinish = () => {
        router.push('/notes')
    }

    // 태그 생성 단계 화면
    if (createdNoteId && showTagsStep) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>노트 태그 생성</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        AI가 노트 내용을 분석하여 관련 태그를 생성해드립니다.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 저장된 노트 내용 미리보기 */}
                    <div className="space-y-2">
                        <Label>저장된 노트</Label>
                        <div className="bg-gray-50 p-4 rounded-md border">
                            <h3 className="font-semibold mb-2">{title}</h3>
                            <p className="text-sm text-gray-700 line-clamp-3">
                                {content}
                            </p>
                        </div>
                    </div>

                    {/* 태그 생성 컴포넌트 */}
                    <TagsGenerator
                        noteId={createdNoteId}
                        title={title}
                        content={content}
                        onTagsChange={handleTagsGenerated}
                    />

                    {/* 완료 버튼 */}
                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleFinish}
                        >
                            나중에 태그하기
                        </Button>
                        <Button
                            type="button"
                            onClick={handleFinish}
                        >
                            완료
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // 노트가 생성되었고 요약 기능이 활성화된 경우 요약 생성 화면 표시
    if (createdNoteId && enableSummary && content.length >= 100 && !showTagsStep) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>노트 요약 생성</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        노트가 성공적으로 저장되었습니다. AI가 내용을 요약해드릴까요?
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 저장된 노트 내용 미리보기 */}
                    <div className="space-y-2">
                        <Label>저장된 노트</Label>
                        <div className="bg-gray-50 p-4 rounded-md border">
                            <h3 className="font-semibold mb-2">{title}</h3>
                            <p className="text-sm text-gray-700 line-clamp-3">
                                {content}
                            </p>
                        </div>
                    </div>

                    {/* 요약 생성 컴포넌트 */}
                    <SummaryGenerator
                        noteId={createdNoteId}
                        content={content}
                        onSummaryGenerated={handleSummaryGenerated}
                    />

                    {/* 완료 버튼 */}
                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleFinish}
                        >
                            나중에 요약하기
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSummaryNext}
                        >
                            {enableTags && content.length >= 50 ? '다음: 태그 생성' : '완료'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>새 노트 작성</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">제목</Label>
                        <Input
                            id="title"
                            name="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="노트 제목을 입력하세요"
                            autoFocus
                            disabled={isPending}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="content">내용</Label>
                        <Textarea
                            id="content"
                            name="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="노트 내용을 입력하세요"
                            rows={10}
                            disabled={isPending}
                        />
                    </div>

                    {/* AI 기능 옵션 */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="enable-summary"
                                checked={enableSummary}
                                onCheckedChange={setEnableSummary}
                                disabled={isPending}
                            />
                            <Label htmlFor="enable-summary" className="text-sm">
                                저장 후 AI 요약 생성 
                                {content.length >= 100 ? 
                                    `(${content.length}자)` : 
                                    `(최소 100자 필요, 현재 ${content.length}자)`
                                }
                            </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="enable-tags"
                                checked={enableTags}
                                onCheckedChange={setEnableTags}
                                disabled={isPending}
                            />
                            <Label htmlFor="enable-tags" className="text-sm">
                                저장 후 AI 태그 생성
                                {content.length >= 50 ? 
                                    `(${content.length}자)` : 
                                    `(최소 50자 필요, 현재 ${content.length}자)`
                                }
                            </Label>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isPending}
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                        >
                            {isPending ? '저장 중...' : '저장'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
