ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;

-- Update existing users to have 'user' role if null
UPDATE "user" SET "role" = 'user' WHERE "role" IS NULL;

-- Set banned to false for existing users if null
UPDATE "user" SET "banned" = false WHERE "banned" IS NULL;
