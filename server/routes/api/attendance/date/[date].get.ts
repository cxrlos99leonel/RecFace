import { defineEventHandler, getRouterParam, createError } from "h3";
import { requireAdmin } from "../../../../lib/auth";
import { kvLrange } from "../../../../lib/storage";

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const date = getRouterParam(event, "date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({ statusCode: 400, message: "Data inválida. Use YYYY-MM-DD." });
  }
  const raw = await kvLrange(`attendance:${date}`, 0, -1);
  const records = raw.map((r) => JSON.parse(r));
  return { records, total: records.length, date };
});
