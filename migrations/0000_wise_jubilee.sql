-- New table: create unguarded so it gets created now
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"full_name" text,
	"phone" text,
	"avatar_url" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint

-- Auth tables: guard with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint

-- profiles FK: leave unguarded (it's new)
ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- account FK: guard (it probably already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'account_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "account"
      ADD CONSTRAINT "account_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- session FK: guard (it probably already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'session_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "session"
      ADD CONSTRAINT "session_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
