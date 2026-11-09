import { defineEventHandler, getRouterParam, createError } from "h3";
import { kvGet } from "../../../lib/storage";
import { requireAdmin } from "../../../lib/auth";
import { publicParticipant, type StoredParticipant } from "../../../lib/participants";

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = getRouterParam(event, "id") ?? "";
  const s = await kvGet<StoredParticipant>(`student:${id}`);
  if (!s) throw createError({ statusCode: 404, message: "Participante não encontrado." });
  return publicParticipant(s);
});
