import { defineEventHandler, getRouterParam } from "h3";
import { requireAdmin } from "../../../lib/auth";
import { kvLrange } from "../../../lib/storage";

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const studentId = getRouterParam(event, "studentId") ?? "";
  const raw = await kvLrange(`attendance:student:${studentId}`, 0, -1);
  const records = raw.map((r) => JSON.parse(r));
  return { student_id: studentId, records, total: records.length };
});
