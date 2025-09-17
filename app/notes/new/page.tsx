// app/notes/new/page.tsx
// 새 노트 작성 페이지 - 사용자가 새로운 노트를 생성할 수 있는 페이지
// 인증된 사용자만 접근 가능하며, 노트 작성 폼을 포함
// 관련 파일: components/notes/note-form.tsx, lib/notes/actions.ts

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NoteForm } from '@/components/notes/note-form'
import { BackButton } from '@/components/ui/back-button'

export default async function NewNotePage() {
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <BackButton 
                    href="/notes" 
                    showHomeLink={true}
                >
                    노트 목록으로
                </BackButton>
            </div>
            
            <div className="mb-6">
                <h1 className="text-3xl font-bold">새 노트 작성</h1>
                <p className="text-muted-foreground mt-2">
                    새로운 노트를 작성하여 아이디어를 기록하세요.
                </p>
            </div>
            
            <NoteForm />
        </div>
    )
}
