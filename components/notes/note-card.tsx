// components/notes/note-card.tsx
// 개별 노트 카드 컴포넌트 - 노트 정보 표시 및 삭제 기능 포함
// 노트 목록에서 사용되는 카드 형태의 노트 표시
// 관련 파일: components/notes/notes-list.tsx, components/notes/delete-note-button.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteNoteButton } from './delete-note-button'
import { HighlightText } from './highlight-text'
import { formatRelativeTime, generateNotePreview } from '@/lib/notes/utils'
import { Sparkles, Tag } from 'lucide-react'
import type { NoteWithDetails } from '@/lib/db/schema/notes'

interface NoteCardProps {
    note: NoteWithDetails
    searchQuery?: string
    onDelete?: (noteId: string) => void
}

export function NoteCard({ note, searchQuery, onDelete }: NoteCardProps) {
    const [isHovered, setIsHovered] = useState(false)

    const handleDeleteSuccess = () => {
        if (onDelete) {
            onDelete(note.id)
        }
    }

    return (
        <div 
            className="relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/notes/${note.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                        <CardTitle className="line-clamp-2 text-lg pr-8">
                            <HighlightText 
                                text={note.title} 
                                highlight={searchQuery || ''} 
                            />
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {formatRelativeTime(note.updatedAt!)}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* AI 요약 표시 */}
                        {note.summary && (
                            <div className="bg-purple-50 p-3 rounded-md border-l-4 border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-800">AI 요약</span>
                                </div>
                                <div className="text-sm text-purple-700 line-clamp-2">
                                    <HighlightText 
                                        text={note.summary} 
                                        highlight={searchQuery || ''} 
                                    />
                                </div>
                            </div>
                        )}

                        {/* AI 태그 표시 */}
                        {note.tags && note.tags.length > 0 && (
                            <div className="flex items-start gap-2">
                                <Tag className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-wrap gap-1">
                                    {note.tags.slice(0, 4).map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-200"
                                        >
                                            <HighlightText 
                                                text={tag} 
                                                highlight={searchQuery || ''} 
                                            />
                                        </span>
                                    ))}
                                    {note.tags.length > 4 && (
                                        <span className="text-xs text-gray-500 px-2 py-1">
                                            +{note.tags.length - 4}개 더
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* 노트 내용 미리보기 */}
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            <HighlightText 
                                text={generateNotePreview(note.content || '')} 
                                highlight={searchQuery || ''} 
                            />
                        </p>
                    </CardContent>
                </Card>
            </Link>
            
            {/* 삭제 버튼 - hover 시 표시 */}
            <div 
                className={`absolute top-2 right-2 transition-opacity duration-200 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <DeleteNoteButton
                    noteId={note.id}
                    noteTitle={note.title}
                    variant="ghost"
                    size="icon"
                    onDeleteSuccess={handleDeleteSuccess}
                    className="bg-white/90 backdrop-blur-sm shadow-sm hover:bg-red-50"
                />
            </div>
        </div>
    )
}
