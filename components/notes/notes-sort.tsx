// components/notes/notes-sort.tsx
// 노트 정렬 드롭다운 컴포넌트 - 최신순, 오래된순, 제목순 정렬 선택
// URL 파라미터와 연동하여 정렬 상태 관리
// 관련 파일: app/notes/page.tsx, lib/notes/queries.ts

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { NotesSort } from '@/lib/notes/queries'

interface NotesSortProps {
    currentSort: NotesSort
}

const sortOptions = [
    { value: 'newest' as const, label: '최신순' },
    { value: 'oldest' as const, label: '오래된순' },
    { value: 'title' as const, label: '제목순' }
]

export function NotesSort({ currentSort }: NotesSortProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSortChange = (newSort: NotesSort) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('sort', newSort)
        params.set('page', '1') // 정렬 변경 시 첫 페이지로 이동
        
        // replace를 사용하여 히스토리 중복 방지
        router.replace(`/notes?${params.toString()}`)
    }

    return (
        <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-32">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
