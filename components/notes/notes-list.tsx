// components/notes/notes-list.tsx
// 노트 목록 컴포넌트 - 낙관적 업데이트를 지원하는 노트 목록 표시
// 삭제 시 즉시 UI 업데이트 후 서버 동기화
// 관련 파일: components/notes/note-card.tsx, app/notes/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { NoteCard } from './note-card'
import type { NoteWithDetails } from '@/lib/db/schema/notes'

interface NotesListProps {
    initialNotes: NoteWithDetails[]
    totalCount: number
    currentPage: number
    totalPages: number
    sortBy: string
    searchQuery?: string
}

export function NotesList({ 
    initialNotes, 
    totalCount, 
    currentPage, 
    totalPages, 
    sortBy,
    searchQuery 
}: NotesListProps) {
    const [notes, setNotes] = useState<NoteWithDetails[]>(initialNotes)
    const [optimisticCount, setOptimisticCount] = useState(totalCount)

    // props 변경 시 상태 동기화
    useEffect(() => {
        setNotes(initialNotes)
        setOptimisticCount(totalCount)
    }, [initialNotes, totalCount])

    const handleNoteDelete = (noteId: string) => {
        // 낙관적 업데이트: 즉시 UI에서 제거
        setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId))
        setOptimisticCount(prevCount => Math.max(0, prevCount - 1))
    }

    if (notes.length === 0) {
        return (
            <Card className="text-center py-12">
                <CardContent>
                    {searchQuery ? (
                        <>
                            <h3 className="text-lg font-medium mb-2">검색 결과가 없습니다</h3>
                            <p className="text-muted-foreground mb-4">
                                &ldquo;{searchQuery}&rdquo;와(과) 일치하는 노트를 찾을 수 없습니다.
                            </p>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>다른 검색어를 시도해보세요:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>더 간단한 키워드 사용</li>
                                    <li>맞춤법 확인</li>
                                    <li>동의어나 유사한 단어 시도</li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-medium mb-2">아직 노트가 없습니다</h3>
                            <p className="text-muted-foreground mb-4">
                                첫 번째 노트를 작성해보세요.
                            </p>
                            <Link href="/notes/new">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    새 노트 작성
                                </Button>
                            </Link>
                        </>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            {/* 노트 그리드 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                    <NoteCard 
                        key={note.id} 
                        note={note} 
                        searchQuery={searchQuery}
                        onDelete={handleNoteDelete}
                    />
                ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    {currentPage > 1 && (
                        <Link href={`/notes?page=${currentPage - 1}&sort=${sortBy}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}>
                            <Button variant="outline">이전</Button>
                        </Link>
                    )}
                    
                    <span className="text-sm text-muted-foreground mx-4">
                        {currentPage} / {totalPages} 페이지
                    </span>
                    
                    {currentPage < totalPages && (
                        <Link href={`/notes?page=${currentPage + 1}&sort=${sortBy}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}>
                            <Button variant="outline">다음</Button>
                        </Link>
                    )}
                </div>
            )}

            {/* 현재 노트 수 표시 (낙관적 업데이트 반영) */}
            <div className="text-sm text-muted-foreground text-center mt-4">
                {searchQuery ? (
                    <>검색 결과: {optimisticCount}개</>
                ) : (
                    <>총 {optimisticCount}개의 노트</>
                )}
            </div>
        </>
    )
}
