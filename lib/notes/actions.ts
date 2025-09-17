// lib/notes/actions.ts
// 노트 관련 Server Actions - Next.js App Router에서 사용하는 서버 사이드 액션
// 클라이언트에서 호출되는 노트 생성, 수정, 삭제 액션 구현
// 관련 파일: lib/notes/queries.ts, app/notes/new/page.tsx, components/notes/note-form.tsx

'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createNote, getNoteById, updateNoteTags } from './queries'
import { insertNoteSchema } from '@/lib/db/schema/notes'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/connection'
import { notes } from '@/lib/db/schema/notes'

export async function createNoteAction(formData: FormData) {
    try {
        // 사용자 인증 확인
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            throw new Error('인증되지 않은 사용자입니다.')
        }

        // 폼 데이터 추출 및 검증
        const title = formData.get('title') as string
        const content = formData.get('content') as string

        const noteData = {
            userId: user.id,
            title: title?.trim() || '제목 없음',
            content: content?.trim() || ''
        }

        // Zod 스키마로 검증
        const validatedData = insertNoteSchema.parse(noteData)

        // 노트 생성
        const newNote = await createNote(validatedData)

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath('/')

        return { success: true, noteId: newNote.id }
    } catch (error) {
        console.error('노트 생성 실패:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : '노트 생성에 실패했습니다.' 
        }
    }
}

export async function updateNoteAction(
    noteId: string,
    updates: { title?: string; content?: string; tags?: string[] }
) {
    try {
        // 사용자 인증 확인
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return { success: false, error: '인증되지 않은 사용자입니다.' }
        }

        // 노트 존재 및 권한 확인
        const existingNote = await getNoteById(noteId, user.id)
        if (!existingNote) {
            return { success: false, error: '노트를 찾을 수 없거나 권한이 없습니다.' }
        }

        // 업데이트할 데이터 준비
        const updateData: { title?: string; content?: string; updatedAt?: Date } = {}
        
        if (updates.title !== undefined) {
            updateData.title = updates.title.trim() || '제목 없음'
        }
        
        if (updates.content !== undefined) {
            updateData.content = updates.content
        }
        
        // 변경사항이 있을 때만 업데이트
        if (Object.keys(updateData).length > 0) {
            updateData.updatedAt = new Date()
            
            await db
                .update(notes)
                .set(updateData)
                .where(eq(notes.id, noteId))
        }

        // 태그 업데이트는 별도 처리
        if (updates.tags !== undefined) {
            await updateNoteTags(noteId, updates.tags)
        }

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath(`/notes/${noteId}`)

        return { success: true }
    } catch (error) {
        console.error('노트 업데이트 실패:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : '노트 업데이트에 실패했습니다.' 
        }
    }
}

export async function deleteNoteAction(noteId: string) {
    try {
        // 사용자 인증 확인
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return { success: false, error: '인증되지 않은 사용자입니다.' }
        }

        // 노트 존재 및 권한 확인
        const existingNote = await getNoteById(noteId, user.id)
        if (!existingNote) {
            return { success: false, error: '노트를 찾을 수 없거나 권한이 없습니다.' }
        }

        // 노트 삭제 실행
        await db
            .delete(notes)
            .where(eq(notes.id, noteId))

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath(`/notes/${noteId}`)
        revalidatePath('/')

        return { success: true }
    } catch (error) {
        console.error('노트 삭제 실패:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : '노트 삭제에 실패했습니다.' 
        }
    }
}

export async function updateNoteTagsAction(
    noteId: string,
    tags: string[]
) {
    try {
        // 사용자 인증 확인
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return { success: false, error: '인증되지 않은 사용자입니다.' }
        }

        // 노트 존재 및 권한 확인
        const existingNote = await getNoteById(noteId, user.id)
        if (!existingNote) {
            return { success: false, error: '노트를 찾을 수 없거나 권한이 없습니다.' }
        }

        // 태그 업데이트 (별도 테이블에 저장)
        await updateNoteTags(noteId, tags)
        
        // 노트 업데이트 시간 갱신
        await db
            .update(notes)
            .set({
                updatedAt: new Date()
            })
            .where(eq(notes.id, noteId))

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath(`/notes/${noteId}`)

        return { success: true }
    } catch (error) {
        console.error('태그 업데이트 실패:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : '태그 업데이트에 실패했습니다.' 
        }
    }
}

export async function redirectToNotes() {
    redirect('/notes')
}
