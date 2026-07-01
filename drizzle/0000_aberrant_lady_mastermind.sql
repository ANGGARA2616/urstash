CREATE TABLE "access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"collection_id" uuid,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_tokens_user_id_idx" ON "access_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "access_tokens_token_hash_idx" ON "access_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "collections_user_id_idx" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "items_user_id_idx" ON "items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "items_collection_id_idx" ON "items" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "items_tags_idx" ON "items" USING gin ("tags");