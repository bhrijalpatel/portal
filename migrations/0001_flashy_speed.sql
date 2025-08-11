ALTER TABLE "profiles" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "display_name" text;