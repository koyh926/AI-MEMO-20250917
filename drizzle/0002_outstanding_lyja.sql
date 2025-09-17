ALTER TABLE "notes" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "tags_generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "tags_status" varchar(20) DEFAULT 'none';