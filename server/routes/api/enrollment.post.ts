import { defineEventHandler, readBody, createError } from "h3";
import { randomUUID } from "node:crypto";
import { kvSet, kvSadd } from "../../lib/storage";
import {
  DUPLICATE_FACE_THRESHOLD,
  findBestMatch,
  invalidateParticipants,
  isValidDescriptor,
  loadParticipants,
} from "../../lib/participants";
import { RATE_LIMITS, enforceRateLimit } from "../../lib/rate-limit";

/**
 * Cadastro feito na própria portaria. Exige o aceite do termo (LGPD).
 * A foto não chega ao servidor: só o vetor de 128 números.
 */
export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, RATE_LIMITS.enrollment);
  const body = await readBody<Record<string, unknown>>(event);
  const name = String(body?.name ?? "").trim().replace(/\s+/g, " ");
  const document = String(body?.document ?? body?.registration_id ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const consent = body?.consent === true;
  const face_descriptor = body?.face_descriptor;

  if (name.length < 3 || name.length > 80)
    throw createError({ statusCode: 400, message: "Informe o nome completo (3 a 80 caracteres)." });
  if (!/^[A-Za-z0-9.\-/ ]{3,30}$/.test(document))
    throw createError({
      statusCode: 400,
      message: "Documento inválido. Use apenas números, letras, ponto, hífen ou barra (3 a 30 caracteres).",
    });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw createError({ statusCode: 400, message: "E-mail inválido." });
  if (!consent)
    throw createError({ statusCode: 400, message: "É preciso aceitar o termo de uso da imagem para concluir o cadastro." });
  if (!isValidDescriptor(face_descriptor))
    throw createError({ statusCode: 400, message: "Dados faciais inválidos. Refaça a captura das fotos." });

  const participants = await loadParticipants(true);
  const normalizedDoc = document.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (participants.some((p) => String(p.registration_id).replace(/[^A-Za-z0-9]/g, "").toUpperCase() === normalizedDoc)) {
    // Mensagem neutra: não confirma a terceiros se um documento está na base.
    throw createError({
      statusCode: 409,
      message:
        "Não foi possível concluir o cadastro com estes dados. Se você já se cadastrou, use a opção Reconhecer rosto; se precisar de ajuda, procure a equipe da entrada.",
    });
  }
  const sameFace = findBestMatch(face_descriptor, participants);
  if (sameFace && sameFace.distance <= DUPLICATE_FACE_THRESHOLD) {
    throw createError({
      statusCode: 409,
      message: "Este rosto já possui cadastro. Use a opção Reconhecer rosto para entrar.",
    });
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  await kvSet(`student:${id}`, {
    id,
    name,
    registration_id: document,
    email,
    created_at: now,
    consent_at: now,
    face_descriptor,
  });
  await kvSadd("students:index", id);
  invalidateParticipants();

  return {
    success: true,
    student_id: id,
    message: `Cadastro de ${name.split(" ")[0]} concluído! Agora é só olhar para a câmera.`,
  };
});
