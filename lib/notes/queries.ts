// lib/notes/queries.ts
// 노트 데이터베이스 쿼리 함수들 - Drizzle ORM을 사용한 CRUD 작업
// 사용자별 노트 조회, 생성, 수정, 삭제 쿼리 로직 구현
// 관련 파일: lib/db/connection.ts, lib/db/schema/notes.ts, lib/notes/actions.ts

import { eq, desc, asc, count, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db/connection'
import { notes, noteTags, summaries, type Note, type NewNote, type NoteWithDetails } from '@/lib/db/schema/notes'

export type NotesSort = 'newest' | 'oldest' | 'title'

export interface PaginatedNotesResult {
    notes: NoteWithDetails[]
    totalCount: number
    totalPages: number
    currentPage: number
}

/**
 * 노트에 태그와 요약 정보를 추가하는 헬퍼 함수
 */
async function enrichNoteWithDetails(note: Note): Promise<NoteWithDetails> {
    // 태그 조회
    const tags = await db
        .select({ tag: noteTags.tag })
        .from(noteTags)
        .where(eq(noteTags.noteId, note.id))
        .then(rows => rows.map(row => row.tag))

    // 최신 요약 조회
    const [latestSummary] = await db
        .select()
        .from(summaries)
        .where(eq(summaries.noteId, note.id))
        .orderBy(desc(summaries.createdAt))
        .limit(1)

    return {
        ...note,
        tags,
        summary: latestSummary?.content,
        summaryGeneratedAt: latestSummary?.createdAt
    }
}

/**
 * 여러 노트에 태그와 요약 정보를 추가하는 헬퍼 함수
 */
async function enrichNotesWithDetails(notesList: Note[]): Promise<NoteWithDetails[]> {
    if (notesList.length === 0) return []

    const noteIds = notesList.map(note => note.id)

    try {
        // 모든 태그 조회
        const allTags = noteIds.length > 0 ? await db
            .select({ noteId: noteTags.noteId, tag: noteTags.tag })
            .from(noteTags)
            .where(sql`${noteTags.noteId} = ANY(ARRAY[${sql.join(noteIds.map(id => sql`${id}`), sql`, `)}]::uuid[])`) : []

        // 모든 요약 조회 (각 노트별 최신 요약만)
        const allSummaries = noteIds.length > 0 ? await db
            .select()
            .from(summaries)
            .where(sql`${summaries.noteId} = ANY(ARRAY[${sql.join(noteIds.map(id => sql`${id}`), sql`, `)}]::uuid[])`)
            .orderBy(desc(summaries.createdAt)) : []

        // 노트별로 태그와 요약 매핑
        return notesList.map(note => {
            const noteTags = allTags
                .filter(t => t.noteId === note.id)
                .map(t => t.tag)

            const noteSummary = allSummaries
                .filter(s => s.noteId === note.id)[0]

            return {
                ...note,
                tags: noteTags,
                summary: noteSummary?.content,
                summaryGeneratedAt: noteSummary?.createdAt
            }
        })
    } catch (error) {
        console.error('노트 상세 정보 조회 실패:', error)
        // 에러 발생 시 기본 노트 정보만 반환
        return notesList.map(note => ({
            ...note,
            tags: [],
            summary: undefined,
            summaryGeneratedAt: undefined
        }))
    }
}

export async function createNote(noteData: Omit<NewNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const [note] = await db
        .insert(notes)
        .values({
            ...noteData,
            title: noteData.title || '제목 없음'
        })
        .returning()
    
    return note
}

export async function getNotesByUserId(userId: string): Promise<NoteWithDetails[]> {
    const notesList = await db
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(desc(notes.updatedAt))
    
    return enrichNotesWithDetails(notesList)
}

export async function getUserNotesPaginated(
    userId: string,
    page: number = 1,
    limit: number = 12,
    sortBy: NotesSort = 'newest'
): Promise<PaginatedNotesResult> {
    const offset = (page - 1) * limit
    
    // 정렬 조건 결정
    const getSortOrder = (sort: NotesSort) => {
        switch (sort) {
            case 'oldest':
                return asc(notes.updatedAt)
            case 'title':
                return asc(notes.title)
            case 'newest':
            default:
                return desc(notes.updatedAt)
        }
    }
    
    // 노트 목록 조회
    const notesList = await db
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(getSortOrder(sortBy))
        .limit(limit)
        .offset(offset)
    
    // 전체 노트 수 조회
    const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(notes)
        .where(eq(notes.userId, userId))
    
    const totalPages = Math.ceil(totalCount / limit)
    
    // 태그와 요약 정보 추가
    const enrichedNotes = await enrichNotesWithDetails(notesList)
    
    return {
        notes: enrichedNotes,
        totalCount,
        totalPages,
        currentPage: page
    }
}

export async function searchUserNotes(
    userId: string,
    searchQuery: string,
    page: number = 1,
    limit: number = 12,
    sortBy: NotesSort = 'newest'
): Promise<PaginatedNotesResult> {
    const offset = (page - 1) * limit
    
    // 검색어가 없으면 기본 조회
    if (!searchQuery.trim()) {
        return getUserNotesPaginated(userId, page, limit, sortBy)
    }

    const searchPattern = `%${searchQuery.trim()}%`
    
    // 정렬 조건 결정
    const getSortOrder = (sort: NotesSort) => {
        switch (sort) {
            case 'oldest':
                return asc(notes.updatedAt)
            case 'title':
                return asc(notes.title)
            case 'newest':
            default:
                return desc(notes.updatedAt)
        }
    }
    
    // 검색 조건: 제목, 본문, 요약, 태그에서 검색
    const searchCondition = or(
        ilike(notes.title, searchPattern),
        ilike(notes.content, searchPattern),
        ilike(summaries.content, searchPattern),
        ilike(noteTags.tag, searchPattern)
    )
    
    // 검색 결과 조회 (제목 우선 정렬)
    const notesList = await db
        .selectDistinct({ 
            id: notes.id,
            userId: notes.userId,
            title: notes.title,
            content: notes.content,
            createdAt: notes.createdAt,
            updatedAt: notes.updatedAt
        })
        .from(notes)
        .leftJoin(summaries, eq(notes.id, summaries.noteId))
        .leftJoin(noteTags, eq(notes.id, noteTags.noteId))
        .where(sql`${eq(notes.userId, userId)} AND ${searchCondition}`)
        .orderBy(
            // 제목 매치 우선, 그 다음 사용자 선택 정렬
            sql`CASE WHEN ${ilike(notes.title, searchPattern)} THEN 1 ELSE 2 END`,
            getSortOrder(sortBy)
        )
        .limit(limit)
        .offset(offset)
    
    // 검색 결과 총 개수
    const [{ totalCount }] = await db
        .selectDistinct({ totalCount: count() })
        .from(notes)
        .leftJoin(summaries, eq(notes.id, summaries.noteId))
        .leftJoin(noteTags, eq(notes.id, noteTags.noteId))
        .where(sql`${eq(notes.userId, userId)} AND ${searchCondition}`)
    
    const totalPages = Math.ceil(totalCount / limit)
    
    // 태그와 요약 정보 추가
    const enrichedNotes = await enrichNotesWithDetails(notesList)
    
    return {
        notes: enrichedNotes,
        totalCount,
        totalPages,
        currentPage: page
    }
}

export async function getRecentUserNotes(userId: string, limit: number = 5): Promise<NoteWithDetails[]> {
    const notesList = await db
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(desc(notes.updatedAt))
        .limit(limit)
    
    return enrichNotesWithDetails(notesList)
}

export async function getNoteById(id: string, userId: string): Promise<NoteWithDetails | null> {
    const [note] = await db
        .select()
        .from(notes)
        .where(eq(notes.id, id))
        .limit(1)
    
    // 사용자 권한 확인
    if (note && note.userId !== userId) {
        return null
    }
    
    if (!note) return null
    
    return enrichNoteWithDetails(note)
}

/**
 * 노트의 태그를 업데이트하는 함수
 */
export async function updateNoteTags(noteId: string, tags: string[]): Promise<void> {
    // 기존 태그 삭제
    await db
        .delete(noteTags)
        .where(eq(noteTags.noteId, noteId))
    
    // 새 태그 추가
    if (tags.length > 0) {
        await db
            .insert(noteTags)
            .values(tags.map(tag => ({ noteId, tag })))
    }
}

/**
 * 노트의 요약을 저장하는 함수
 */
export async function saveNoteSummary(noteId: string, content: string, model: string = 'gemini-2.0-flash-001'): Promise<void> {
    await db
        .insert(summaries)
        .values({ noteId, content, model })
}

/**
 * 노트의 최신 요약을 가져오는 함수
 */
export async function getLatestSummary(noteId: string): Promise<string | null> {
    const [summary] = await db
        .select({ content: summaries.content })
        .from(summaries)
        .where(eq(summaries.noteId, noteId))
        .orderBy(desc(summaries.createdAt))
        .limit(1)
    
    return summary?.content || null
}

/**
 * 노트의 모든 태그를 가져오는 함수
 */
export async function getNoteTags(noteId: string): Promise<string[]> {
    const tags = await db
        .select({ tag: noteTags.tag })
        .from(noteTags)
        .where(eq(noteTags.noteId, noteId))
    
    return tags.map(t => t.tag)
}
