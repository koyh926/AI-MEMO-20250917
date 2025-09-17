// app/notes/[id]/page.tsx
// 노트 상세 편집 페이지 - 특정 노트를 실시간으로 편집할 수 있는 페이지
// 자동 저장, 키보드 단축키, 로컬 스토리지 백업 기능 포함
// 관련 파일: lib/notes/queries.ts, components/notes/note-editor.tsx

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNoteById } from '@/lib/notes/queries'
import { NoteEditor } from '@/components/notes/note-editor'

interface NotePageProps {
    params: Promise<{ id: string }>
}

export default async function NotePage({ params }: NotePageProps) {
    const { id } = await params
    
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    // 노트 조회
    const note = await getNoteById(id, user.id)

    if (!note) {
        notFound()
    }

    return <NoteEditor note={note} />
}
