// app/notes/page.tsx
// 노트 목록 페이지 - 사용자의 모든 노트를 표시하는 메인 노트 페이지
// 페이지네이션, 정렬 기능을 포함한 노트 목록 조회
// 관련 파일: lib/notes/queries.ts, components/notes/notes-sort.tsx

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserNotesPaginated, searchUserNotes, type NotesSort, type PaginatedNotesResult } from '@/lib/notes/queries'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { NotesSort as NotesSortComponent } from '@/components/notes/notes-sort'
import { NotesList } from '@/components/notes/notes-list'
import { SearchInput } from '@/components/notes/search-input'
import { BackButton } from '@/components/ui/back-button'

interface NotesPageProps {
    searchParams: Promise<{
        page?: string
        sort?: string
        search?: string
    }>
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
    const params = await searchParams
    
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    // URL 파라미터 파싱
    const currentPage = parseInt(params.page || '1', 10)
    const sortBy = (params.sort as NotesSort) || 'newest'
    const searchQuery = params.search || ''

    // 사용자의 노트 목록 조회 (검색 및 페이지네이션 적용)
    let notesData: PaginatedNotesResult = { notes: [], totalCount: 0, totalPages: 0, currentPage: 1 }
    try {
        if (searchQuery.trim()) {
            notesData = await searchUserNotes(user.id, searchQuery, currentPage, 12, sortBy)
        } else {
            notesData = await getUserNotesPaginated(user.id, currentPage, 12, sortBy)
        }
    } catch (error) {
        console.error('노트 조회 실패:', error)
    }

    const { notes, totalCount, totalPages } = notesData

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <BackButton 
                    href="/" 
                    showHomeLink={true}
                >
                    대시보드로
                </BackButton>
            </div>
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">내 노트</h1>
                    <p className="text-muted-foreground mt-2">
                        총 {totalCount}개의 노트가 있습니다.
                    </p>
                </div>
                
                <Link href="/notes/new">
                    <Button className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        새 노트 작성
                    </Button>
                </Link>
            </div>

            {/* 검색 입력 필드 */}
            <div className="mb-6">
                <SearchInput placeholder="노트 제목이나 내용으로 검색..." />
            </div>

            {/* 정렬 드롭다운 */}
            {totalCount > 0 && (
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-muted-foreground">
                        {searchQuery ? (
                            <span>&ldquo;{searchQuery}&rdquo; 검색 결과</span>
                        ) : (
                            <span>전체 노트</span>
                        )}
                    </div>
                    <NotesSortComponent currentSort={sortBy} />
                </div>
            )}

            <NotesList 
                initialNotes={notes}
                totalCount={totalCount}
                currentPage={currentPage}
                totalPages={totalPages}
                sortBy={sortBy}
                searchQuery={searchQuery}
            />
        </div>
    )
}
