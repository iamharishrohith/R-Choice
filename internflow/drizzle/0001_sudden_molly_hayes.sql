ALTER TYPE "public"."job_status" ADD VALUE 'pending_mcr_approval' BEFORE 'approved';--> statement-breakpoint
ALTER TYPE "public"."request_status" ADD VALUE 'pending_coe' BEFORE 'pending_principal';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'coe';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'placement_head';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'management_corporation';--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"respondent_id" uuid NOT NULL,
	"response_data" jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"target_audience" varchar(50) NOT NULL,
	"created_by_role" "user_role" NOT NULL,
	"created_by_id" uuid,
	"form_schema" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "is_ppo_available" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "is_campus_hiring" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "expected_joining_date" date;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "interview_mode" varchar(50);--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "selection_process_steps" jsonb;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "school" varchar(100);--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "program" varchar(100);--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "batch_start_year" integer;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "batch_end_year" integer;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "course" varchar(100);--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_respondent_id_users_id_fk" FOREIGN KEY ("respondent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;