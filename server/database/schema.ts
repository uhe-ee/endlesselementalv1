import { pgTable, text, serial, unique } from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: serial().primaryKey(),
  text: text("text").notNull().unique(),
  emoji: text("emoji").notNull(),
  description: text("description").notNull(),
});

export const recipes = pgTable(
  "recipes",
  {
    a: text("a").notNull(),
    b: text("b").notNull(),
    result: text("result").notNull(),
  },
  (table) => {
    return [unique("combination").on(table.a, table.b)];
  },
);
