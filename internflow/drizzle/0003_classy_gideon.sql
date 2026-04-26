CREATE TABLE "approval_escalations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"escalated_from_tier" integer NOT NULL,
	"escalated_to_tier" integer NOT NULL,
	"escalation_reason" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_registration_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(100) NOT NULL,
	"generated_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false,
	"used_by_company_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "company_registration_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "company_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role_in_company" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "company_staff_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "selection_process_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"round_name" varchar(100) NOT NULL,
	"round_type" varchar(50),
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "company_description" text;--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "coi" text;--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "ceo_name" varchar(100);--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "ceo_designation" varchar(100);--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "ceo_email" varchar(255);--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "ceo_phone" varchar(15);--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "ceo_linkedin" text;--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "ceo_portfolio" text;--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "id_proof" text;--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "internship_type" varchar(50);--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "domains" text[];--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "duration" varchar(50);--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "stipend_range" varchar(100);--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "hiring_intention" varchar(100);--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "domain" varchar(100);--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "responsibilities" text;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "learnings" text;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "mandatory_skills" text[];--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "preferred_skills" text[];--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "tools" text[];--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "eligibility_degree" text[];--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "perks" text[];--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "faq" jsonb;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "contact_persons" jsonb;--> statement-breakpoint
ALTER TABLE "approval_escalations" ADD CONSTRAINT "approval_escalations_request_id_internship_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."internship_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_registration_links" ADD CONSTRAINT "company_registration_links_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_registration_links" ADD CONSTRAINT "company_registration_links_used_by_company_id_company_registrations_id_fk" FOREIGN KEY ("used_by_company_id") REFERENCES "public"."company_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_staff" ADD CONSTRAINT "company_staff_company_id_company_registrations_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_staff" ADD CONSTRAINT "company_staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selection_process_rounds" ADD CONSTRAINT "selection_process_rounds_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;