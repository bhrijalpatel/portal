CREATE TABLE "user_locks" (
	"id" text PRIMARY KEY NOT NULL,
	"locked_user_id" text NOT NULL,
	"locked_by_admin_id" text NOT NULL,
	"locked_by_admin_email" text NOT NULL,
	"lock_type" text DEFAULT 'edit' NOT NULL,
	"session_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
