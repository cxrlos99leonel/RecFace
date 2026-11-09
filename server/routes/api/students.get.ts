import { defineEventHandler } from "h3";
import { requireAdmin } from "../../lib/auth";
import { loadParticipants, publicParticipant } from "../../lib/participants";

export default defineEventHandler(async (event) => {
  requireAdmin(event);
  const list = (await loadParticipants(true))
    .map(publicParticipant)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return { students: list, total: list.length };
});
