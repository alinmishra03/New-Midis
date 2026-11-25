CREATE TABLE "sheet_sync_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"alias" text NOT NULL,
	"employee_id" uuid,
	"project_id" uuid,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheet_sync_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_tab" text NOT NULL,
	"fingerprint" text NOT NULL,
	"row_number" integer NOT NULL,
	"kind" text NOT NULL,
	"group_key" text,
	"project_id" uuid,
	"task_id" uuid,
	"comment_id" uuid,
	"source" jsonb NOT NULL,
	"applied" jsonb,
	"state" text NOT NULL,
	"review_reason" text,
	"review_detail" text,
	"decision" text,
	"decision_data" jsonb,
	"resolved_by_id" uuid,
	"resolved_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_run_id" uuid
);
--> statement-breakpoint
CREATE TABLE "sheet_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger" text NOT NULL,
	"mode" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"spreadsheet_title" text,
	"counts" jsonb,
	"error" text,
	"actor_user_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sheet_sync_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"auto_import" boolean DEFAULT false NOT NULL,
	"updated_by_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sheet_sync_aliases" ADD CONSTRAINT "sheet_sync_aliases_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_sync_aliases" ADD CONSTRAINT "sheet_sync_aliases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_sync_aliases" ADD CONSTRAINT "sheet_sync_aliases_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_sync_records" ADD CONSTRAINT "sheet_sync_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_sync_records" ADD CONSTRAINT "sheet_sync_records_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_sync_records" ADD CONSTRAINT "sheet_sync_records_comment_id_task_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."task_comments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_sync_records" ADD CONSTRAINT "sheet_sync_records_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_sync_records" ADD CONSTRAINT "sheet_sync_records_last_run_id_sheet_sync_runs_id_fk" FOREIGN KEY ("last_run_id") REFERENCES "public"."sheet_sync_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_sync_runs" ADD CONSTRAINT "sheet_sync_runs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_sync_settings" ADD CONSTRAINT "sheet_sync_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sheet_sync_aliases_uq" ON "sheet_sync_aliases" USING btree ("kind","alias");--> statement-breakpoint
CREATE UNIQUE INDEX "sheet_sync_records_fp_uq" ON "sheet_sync_records" USING btree ("source_tab","fingerprint");--> statement-breakpoint
CREATE INDEX "sheet_sync_records_state_idx" ON "sheet_sync_records" USING btree ("state");--> statement-breakpoint
CREATE INDEX "sheet_sync_records_group_idx" ON "sheet_sync_records" USING btree ("group_key");--> statement-breakpoint
CREATE INDEX "sheet_sync_runs_started_idx" ON "sheet_sync_runs" USING btree ("started_at");