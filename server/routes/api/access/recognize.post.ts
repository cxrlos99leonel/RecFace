import { defineEventHandler, readBody, createError } from "h3";
import {
  MATCH_THRESHOLD,
  findBestMatch,
  formatTimeBR,
  isValidDescriptor,
  loadParticipants,
  logDenied,
  registerEntry,
  similarityFromDistance,
} from "../../../lib/participants";
import { RATE_LIMITS, enforceRateLimit } from "../../../lib/rate-limit";

/**
 * Portaria: recebe o vetor facial capturado pela câmera, compara com os
 * participantes no servidor (os vetores nunca saem do servidor) e registra
 * a tentativa de acesso.
 */
export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, RATE_LIMITS.recognize);
  const body = await readBody<{ descriptor?: unknown }>(event);
  const descriptor = body?.descriptor;
  if (!isValidDescriptor(descriptor)) {
    throw createError({ statusCode: 400, message: "Leitura facial inválida. Tente novamente." });
  }

  const participants = await loadParticipants();
  const match = findBestMatch(descriptor, participants);

  if (!match || match.distance > MATCH_THRESHOLD) {
    await logDenied(match ? similarityFromDistance(match.distance) : undefined);
    return {
      result: "negado" as const,
      message: "Rosto não reconhecido.",
    };
  }

  const similarity = similarityFromDistance(match.distance);
  const { participant } = match;
  const firstName = participant.name.split(/\s+/)[0];
  const entry = await registerEntry(participant, "autorizado", similarity);

  if (entry.status === "duplicado") {
    return {
      result: "duplicado" as const,
      name: firstName,
      first_time: entry.firstAt ? formatTimeBR(entry.firstAt) : null,
      message: entry.firstAt
        ? `Entrada de ${firstName} já registrada hoje às ${formatTimeBR(entry.firstAt)}.`
        : `Entrada de ${firstName} já registrada hoje.`,
    };
  }

  return {
    result: "autorizado" as const,
    name: firstName,
    time: formatTimeBR(entry.record.timestamp),
    similarity,
    message: `Acesso liberado. Bem-vindo(a), ${firstName}!`,
  };
});
