CREATE TABLE "admin_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text,
	"admin_email" text,
	"action" text NOT NULL,
	"target_user_id" text,
	"target_email" text,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp NOT NULL
);
