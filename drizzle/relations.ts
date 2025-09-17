import { relations } from "drizzle-orm/relations";
import { notes, noteTags, summaries } from "./schema";

/**
 * 노트와 태그 관계
 */
export const notesTagsRelations = relations(notes, ({ many }) => ({
	tags: many(noteTags),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
	note: one(notes, {
		fields: [noteTags.noteId],
		references: [notes.id],
	}),
}));

/**
 * 노트와 요약 관계
 */
export const notesSummariesRelations = relations(notes, ({ many }) => ({
	summaries: many(summaries),
}));

export const summariesRelations = relations(summaries, ({ one }) => ({
	note: one(notes, {
		fields: [summaries.noteId],
		references: [notes.id],
	}),
}));
