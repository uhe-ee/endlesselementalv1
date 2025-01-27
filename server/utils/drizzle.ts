import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { reset, seed } from "drizzle-seed";

export { sql, eq, and, or } from "drizzle-orm";

import * as schema from "../database/schema";

export const tables = schema;

export function useDrizzle() {
  return drizzle(process.env.DATABASE_URL!);
}

export async function resetDb() {
  const db = useDrizzle();
  await db.execute(sql`
TRUNCATE ${tables.items} RESTART IDENTITY;
TRUNCATE ${tables.recipes};
`);
  await db
    .insert(tables.items)
    .values([
      {
        text: "Water",
        emoji: "💧",
        description: "A clear liquid essential for life.",
      },
      {
        text: "Fire",
        emoji: "🔥",
        description: "A powerful burning substance.",
      },
      {
        text: "Earth",
        emoji: "🌱",
        description: "The foundation of our planet's surface.",
      },
      {
        text: "Air",
        emoji: "💨",
        description: "The invisible gaseous element surrounding us.",
      },
    ])
    .onConflictDoNothing();
}
