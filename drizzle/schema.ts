import { pgTable, uuid, text, timestamp, varchar, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

/**
 * 노트 테이블 - 기본 노트 정보만 저장
 */
export const notes = pgTable("notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: text().default('제목 없음').notNull(),
	content: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

/**
 * 노트 태그 테이블 - 노트별 태그를 별도 저장
 */
export const noteTags = pgTable("note_tags", {
	noteId: uuid("note_id").notNull().references(() => notes.id, { onDelete: 'cascade' }),
	tag: text().notNull(),
}, (table) => ({
	pk: primaryKey({ columns: [table.noteId, table.tag] })
}));

/**
 * 요약 테이블 - 노트별 AI 생성 요약을 별도 저장
 */
export const summaries = pgTable("summaries", {
	noteId: uuid("note_id").notNull().references(() => notes.id, { onDelete: 'cascade' }),
	model: varchar("model", { length: 100 }).notNull().default('gemini-2.0-flash-001'),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
