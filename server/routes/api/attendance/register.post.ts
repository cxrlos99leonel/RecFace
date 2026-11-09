import { defineEventHandler, readBody, createError } from "h3";
import { kvGet } from "../../../lib/storage";
import { requireAdmin } from "../../../lib/auth";
import { formatTimeBR, registerEntry } from "../../../lib/participants";

/**
 * Liberação manual feita pelo administrador quando o reconhecimento falha
 * (óculos, iluminação ruim…). Fica registrada como "manual".
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const body = await readBody<{ student_id?: unknown }>(event);
  const student_id = String(body?.student_id ?? "");
  if (!student_id) throw createError({ statusCode: 400, message: "Participante não informado." });

  const participant = await kvGet<{ id: string; name: string }>(`student:${student_id}`);
  if (!participant) throw createError({ statusCode: 404, message: "Participante não encontrado." });

  const entry = await registerEntry({ id: student_id, name: participant.name }, "manual");
  if (entry.status === "duplicado") {
    return {
      success: false,
      already_registered: true,
      message: entry.firstAt
        ? `${participant.name} já entrou hoje às ${formatTimeBR(entry.firstAt)}.`
        : `${participant.name} já entrou hoje.`,
    };
  }
  return {
    success: true,
    already_registered: false,
    record_id: entry.record.id,
    message: `Entrada de ${participant.name} liberada manualmente às ${formatTimeBR(entry.record.timestamp)}.`,
  };
});
