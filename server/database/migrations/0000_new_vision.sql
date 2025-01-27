CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"emoji" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "items_text_unique" UNIQUE("text")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"a" text NOT NULL,
	"b" text NOT NULL,
	"result" text NOT NULL,
	CONSTRAINT "combination" UNIQUE("a","b")
);
