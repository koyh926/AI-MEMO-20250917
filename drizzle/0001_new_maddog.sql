ALTER TABLE "notes" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "summary_generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "summary_status" varchar(20) DEFAULT 'none';