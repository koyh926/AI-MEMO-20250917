// lib/db/schema/notes.ts
// 노트 데이터 모델 스키마 정의 - Drizzle ORM을 사용하여 PostgreSQL 테이블 구조 정의
// 사용자별 노트 생성, 조회, 수정, 삭제를 위한 테이블 스키마
// 관련 파일: drizzle.config.ts, lib/notes/actions.ts, lib/notes/queries.ts

import { pgTable, uuid, text, timestamp, varchar, primaryKey } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

/**
 * 노트 테이블 - 기본 노트 정보만 저장
 */
export const notes = pgTable('notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    title: text('title').notNull().default('제목 없음'),
    content: text('content'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

/**
 * 노트 태그 테이블 - 노트별 태그를 별도 저장
 */
export const noteTags = pgTable('note_tags', {
    noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.noteId, table.tag] })
}))

/**
 * 요약 테이블 - 노트별 AI 생성 요약을 별도 저장
 */
export const summaries = pgTable('summaries', {
    noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    model: varchar('model', { length: 100 }).notNull().default('gemini-2.0-flash-001'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Zod 스키마 자동 생성
export const insertNoteSchema = createInsertSchema(notes)
export const selectNoteSchema = createSelectSchema(notes)
export const insertNoteTagSchema = createInsertSchema(noteTags)
export const selectNoteTagSchema = createSelectSchema(noteTags)
export const insertSummarySchema = createInsertSchema(summaries)
export const selectSummarySchema = createSelectSchema(summaries)

export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type NoteTag = typeof noteTags.$inferSelect
export type NewNoteTag = typeof noteTags.$inferInsert
export type Summary = typeof summaries.$inferSelect
export type NewSummary = typeof summaries.$inferInsert

/**
 * 노트와 관련 데이터를 포함한 확장된 타입
 */
export interface NoteWithDetails extends Note {
    tags: string[]
    summary?: string
    summaryGeneratedAt?: Date | null
}
