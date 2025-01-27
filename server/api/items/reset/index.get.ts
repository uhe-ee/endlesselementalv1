import { resetDb } from "~/server/utils/drizzle";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  if (query.key === process.env.DB_KEY) {
    await resetDb();

    return "Success";
  }

  throw createError({
    statusCode: 403,
    statusMessage: "Forbidden",
  });
});
