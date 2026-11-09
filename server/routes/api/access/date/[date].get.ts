import { defineEventHandler, getRouterParam, createError } from "h3";
import { kvLrange } from "../../../../lib/storage";
import { requireAdmin } from "../../../../lib/auth";
import { loadParticipants, type AccessRecord } from "../../../../lib/participants";

/**
 * Todas as tentativas de acesso de uma data, da mais recente para a mais antiga.
 * Inclui as entradas registradas antes desta versão (que só existem em attendance:{data}).
 * Nomes de participantes já excluídos não são exibidos.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const date = getRouterParam(event, "date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({ statusCode: 400, message: "Data inválida. Use AAAA-MM-DD." });
  }

  const [accessRaw, legacyRaw, participants] = await Promise.all([
    kvLrange(`access:${date}`, 0, -1),
    kvLrange(`attendance:${date}`, 0, -1),
    loadParticipants(true),
  ]);

  const records: AccessRecord[] = accessRaw.map((r) => JSON.parse(r));
  const known = new Set(records.map((r) => r.id));
  for (const raw of legacyRaw) {
    const r = JSON.parse(raw);
    if (r.id && known.has(r.id)) continue;
    records.push({
      id: r.id ?? `${r.student_id}-${r.timestamp}`,
      student_id: r.student_id,
      name: r.name,
      timestamp: r.timestamp,
      date,
      result: "autorizado",
    });
  }

  const existing = new Set(participants.map((p) => p.id));
  const cleaned = records
    .map((r) =>
      r.student_id && !existing.has(r.student_id) ? { ...r, name: "Participante removido", removed: true } : r
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return { date, records: cleaned, participants_total: participants.length };
});
