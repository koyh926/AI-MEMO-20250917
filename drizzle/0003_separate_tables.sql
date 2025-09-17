-- 0003_separate_tables.sql
-- 기존 notes 테이블의 tags, summary 관련 컬럼을 별도 테이블로 분리

-- 1. 새로운 테이블 생성
CREATE TABLE IF NOT EXISTS "note_tags" (
	"note_id" uuid NOT NULL,
	"tag" text NOT NULL,
	CONSTRAINT "note_tags_pk" PRIMARY KEY("note_id","tag")
);

CREATE TABLE IF NOT EXISTS "summaries" (
	"note_id" uuid NOT NULL,
	"model" varchar(100) DEFAULT 'gemini-2.0-flash-001' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);

-- 2. 기존 데이터 마이그레이션
-- tags 데이터를 note_tags 테이블로 이동
INSERT INTO "note_tags" ("note_id", "tag")
SELECT 
    "id" as "note_id",
    unnest("tags") as "tag"
FROM "notes" 
WHERE "tags" IS NOT NULL AND array_length("tags", 1) > 0;

-- summary 데이터를 summaries 테이블로 이동
INSERT INTO "summaries" ("note_id", "model", "content", "created_at")
SELECT 
    "id" as "note_id",
    'gemini-2.0-flash-001' as "model",
    "summary" as "content",
    COALESCE("summary_generated_at", "created_at") as "created_at"
FROM "notes" 
WHERE "summary" IS NOT NULL AND "summary" != '';

-- 3. 기존 컬럼 제거
ALTER TABLE "notes" DROP COLUMN IF EXISTS "summary";
ALTER TABLE "notes" DROP COLUMN IF EXISTS "summary_generated_at";
ALTER TABLE "notes" DROP COLUMN IF EXISTS "summary_status";
ALTER TABLE "notes" DROP COLUMN IF EXISTS "tags";
ALTER TABLE "notes" DROP COLUMN IF EXISTS "tags_generated_at";
ALTER TABLE "notes" DROP COLUMN IF EXISTS "tags_status";

-- 4. 외래키 제약조건 추가
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE cascade;
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE cascade;
