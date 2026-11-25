CREATE TABLE "sheet_sync_uploads" (
	"tab" text PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"encoding" text NOT NULL,
	"delimiter" text NOT NULL,
	"columns" jsonb NOT NULL,
	"data_rows" integer NOT NULL,
	"rows" jsonb NOT NULL,
	"uploaded_by_id" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sheet_sync_runs" ADD COLUMN "files" jsonb;--> statement-breakpoint
ALTER TABLE "sheet_sync_uploads" ADD CONSTRAINT "sheet_sync_uploads_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;