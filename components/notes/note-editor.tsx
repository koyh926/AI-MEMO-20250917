// components/notes/note-editor.tsx
// 메인 노트 편집기 컴포넌트 - 노트 제목과 본문을 편집할 수 있는 통합 편집기
// 자동 저장, 키보드 단축키, 저장 상태 표시 등의 기능 포함
// 관련 파일: app/notes/[id]/page.tsx, lib/notes/hooks.ts, components/notes/save-status.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { BackButton } from '@/components/ui/back-button'
import { SaveStatusDisplay } from './save-status'
import { AutoResizeTextarea } from './auto-resize-textarea'
import { DeleteNoteButton } from './delete-note-button'
import { SummaryGenerator } from './summary-generator'
import { TagsGenerator } from './tags-generator'
import { useAutoSave } from '@/lib/notes/hooks'
import { formatRelativeTime } from '@/lib/notes/utils'
import type { NoteWithDetails } from '@/lib/db/schema/notes'

interface NoteEditorProps {
    note: NoteWithDetails
}

export function NoteEditor({ note }: NoteEditorProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const titleInputRef = useRef<HTMLInputElement>(null)
    const contentTextareaRef = useRef<HTMLTextAreaElement>(null)

    const {
        title,
        content,
        saveStatus,
        setTitle,
        setContent,
        saveNow,
        hasUnsavedChanges
    } = useAutoSave({
        noteId: note.id,
        initialTitle: note.title,
        initialContent: note.content || ''
    })

    // 제목 편집 모드 진입
    const startEditingTitle = () => {
        setIsEditingTitle(true)
        setTimeout(() => {
            titleInputRef.current?.focus()
            titleInputRef.current?.select()
        }, 0)
    }

    // 제목 편집 완료
    const finishEditingTitle = () => {
        setIsEditingTitle(false)
    }

    // 키보드 이벤트 핸들러
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + S: 즉시 저장
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                saveNow()
            }

            // ESC: 제목 편집 모드 종료
            if (e.key === 'Escape' && isEditingTitle) {
                finishEditingTitle()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [saveNow, isEditingTitle])

    // 커스텀 저장 이벤트 리스너 (textarea에서 발생)
    useEffect(() => {
        const handleSaveShortcut = () => {
            saveNow()
        }

        const textarea = contentTextareaRef.current
        if (textarea) {
            textarea.addEventListener('save-shortcut', handleSaveShortcut)
            return () => textarea.removeEventListener('save-shortcut', handleSaveShortcut)
        }
    }, [saveNow])

    // 페이지 언로드 시 미저장 변경사항 경고
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault()
                e.returnValue = '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?'
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasUnsavedChanges])

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
                <BackButton showHomeLink={true} />
                <div className="flex items-center gap-4">
                    <SaveStatusDisplay 
                        status={saveStatus} 
                        onRetry={saveNow}
                    />
                    <DeleteNoteButton
                        noteId={note.id}
                        noteTitle={note.title}
                        variant="outline"
                        size="sm"
                        redirectAfterDelete={true}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                        삭제
                    </DeleteNoteButton>
                </div>
            </div>

            {/* 편집 영역 */}
            <div className="space-y-6">
                {/* 제목 편집 */}
                <div className="space-y-2">
                    {isEditingTitle ? (
                        <Input
                            ref={titleInputRef}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={finishEditingTitle}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    finishEditingTitle()
                                }
                            }}
                            className="text-2xl font-bold border-none px-0 py-2 focus:ring-0 focus:border-b-2 focus:border-blue-500"
                            placeholder="노트 제목을 입력하세요"
                        />
                    ) : (
                        <h1
                            className="text-2xl font-bold cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                            onClick={startEditingTitle}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    startEditingTitle()
                                }
                            }}
                        >
                            {title || '제목 없음'}
                        </h1>
                    )}
                    
                    {/* 메타 정보 */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>작성: {formatRelativeTime(note.createdAt!)}</span>
                        <span>수정: {formatRelativeTime(note.updatedAt!)}</span>
                        {hasUnsavedChanges && (
                            <span className="text-orange-600">• 변경사항 있음</span>
                        )}
                    </div>
                </div>

                {/* 본문 편집 */}
                <div className="space-y-2">
                    <AutoResizeTextarea
                        ref={contentTextareaRef}
                        value={content}
                        onChange={setContent}
                        placeholder="노트 내용을 입력하세요..."
                        minRows={10}
                        maxRows={50}
                        className="text-base leading-relaxed"
                    />
                </div>

                {/* AI 기능들 */}
                <div className="space-y-6">
                    {/* 태그 생성 기능 */}
                    {content.length >= 50 && (
                        <div className="border-t pt-6">
                            <TagsGenerator
                                noteId={note.id}
                                title={title}
                                content={content}
                                existingTags={note.tags || []}
                                onTagsChange={(tags) => {
                                    // 태그가 변경되면 자동으로 저장됩니다 (API에서 처리)
                                    console.log('태그 변경됨:', tags)
                                }}
                            />
                        </div>
                    )}

                    {/* 요약 생성 기능 */}
                    {content.length >= 100 && (
                        <div className="border-t pt-6">
                            <SummaryGenerator
                                noteId={note.id}
                                content={content}
                                existingSummary={note.summary || undefined}
                                onSummaryGenerated={(summary) => {
                                    // 요약이 생성되면 자동으로 저장됩니다 (API에서 처리)
                                    console.log('요약 생성됨:', summary)
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* 키보드 단축키 안내 */}
                <div className="text-xs text-muted-foreground border-t pt-4">
                    <p>💡 팁: Cmd/Ctrl + S로 즉시 저장할 수 있습니다. 변경사항은 3초 후 자동으로 저장됩니다.</p>
                </div>
            </div>
        </div>
    )
}
