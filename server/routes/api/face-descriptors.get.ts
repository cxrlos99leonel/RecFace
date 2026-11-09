import { defineEventHandler } from "h3";
import { requireAdmin } from "../../lib/auth";
import { loadParticipants } from "../../lib/participants";

/**
 * Mantida por compatibilidade. A portaria agora compara os rostos no servidor
 * (POST /api/access/recognize); por isso esta rota exige login de administrador.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const list = await loadParticipants(true);
  return {
    students: list
      .filter((p) => p.face_descriptor?.length)
      .map((p) => ({ student_id: p.id, name: p.name, descriptor: p.face_descriptor })),
  };
});
