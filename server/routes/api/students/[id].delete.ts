import { defineEventHandler, getRouterParam, createError } from "h3";
import { kvGet, kvDel, kvSrem } from "../../../lib/storage";
import { requireAdmin } from "../../../lib/auth";
import { invalidateParticipants } from "../../../lib/participants";

/** Exclui o participante, o vetor facial e o histórico de entradas. */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const id = getRouterParam(event, "id") ?? "";
  const s = await kvGet<{ id: string; name: string }>(`student:${id}`);
  if (!s) throw createError({ statusCode: 404, message: "Participante não encontrado." });

  await kvDel(`student:${id}`);
  await kvSrem("students:index", id);
  await kvDel(`attendance:student:${id}`);
  invalidateParticipants();

  return { success: true, message: `Cadastro de '${s.name}' excluído.` };
});
