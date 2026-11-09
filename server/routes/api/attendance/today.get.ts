import { defineEventHandler } from "h3";
import { requireAdmin } from "../../../lib/auth";
import { kvLrange } from "../../../lib/storage";
import { getBrazilDate } from "../../../lib/date";

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const today = getBrazilDate();
  const raw = await kvLrange(`attendance:${today}`, 0, -1);
  const records = raw.map((r) => JSON.parse(r));
  return { records, total: records.length, date: today };
});
