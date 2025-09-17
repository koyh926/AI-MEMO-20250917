-- 1. 새 테이블 생성
CREATE TABLE "note_tags" (
	"note_id" uuid NOT NULL,
	"tag" text NOT NULL,
	CONSTRAINT "note_tags_note_id_tag_pk" PRIMARY KEY("note_id","tag")
);
--> statement-breakpoint
CREATE TABLE "summaries" (
	"note_id" uuid NOT NULL,
	"model" varchar(100) DEFAULT 'gemini-2.0-flash-001' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

-- 2. 외래키 설정
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- 3. 기존 데이터 마이그레이션
-- tags 데이터를 note_tags 테이블로 이동
INSERT INTO "note_tags" ("note_id", "tag")
SELECT 
    "id" as "note_id",
    unnest("tags") as "tag"
FROM "notes" 
WHERE "tags" IS NOT NULL AND array_length("tags", 1) > 0;
--> statement-breakpoint

-- summary 데이터를 summaries 테이블로 이동
INSERT INTO "summaries" ("note_id", "model", "content", "created_at")
SELECT 
    "id" as "note_id",
    'gemini-2.0-flash-001' as "model",
    "summary" as "content",
    COALESCE("summary_generated_at", "created_at") as "created_at"
FROM "notes" 
WHERE "summary" IS NOT NULL AND "summary" != '';
--> statement-breakpoint

-- 4. 기존 컬럼 제거
ALTER TABLE "notes" DROP COLUMN "summary";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "summary_generated_at";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "summary_status";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "tags_generated_at";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "tags_status";