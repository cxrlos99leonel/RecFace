/**
 * Regras de negócio dos participantes e dos acessos.
 *
 * Chaves no Redis (as de "student" e "attendance" vêm da versão anterior e
 * continuam válidas, para não perder os dados já cadastrados):
 *   student:{id}                participante (nome, documento, vetor facial…)
 *   students:index              conjunto com os IDs
 *   attendance:{AAAA-MM-DD}     entradas liberadas do dia
 *   attendance:student:{id}     histórico de entradas do participante
 *   access:{AAAA-MM-DD}         todas as tentativas do dia (liberadas, negadas, duplicadas)
 *   cooldown:{id}:{AAAA-MM-DD}  trava de uma entrada por pessoa por dia (guarda o horário)
 */
import { randomUUID } from "node:crypto";
import { kvGet, kvLpush, kvMget, kvSetNx, kvSmembers } from "./storage";
import { getBrazilDate } from "./date";

export const DESCRIPTOR_LENGTH = 128;
/** Distância máxima para considerar dois rostos a mesma pessoa. */
export const MATCH_THRESHOLD = 0.5;
/** Distância abaixo da qual um novo cadastro é considerado o mesmo rosto de alguém já cadastrado. */
export const DUPLICATE_FACE_THRESHOLD = 0.42;

export interface StoredParticipant {
  id: string;
  name: string;
  /** Documento (CPF/RG). O nome do campo vem da versão anterior (matrícula). */
  registration_id: string;
  email?: string;
  class?: string;
  created_at: string;
  consent_at?: string;
  face_descriptor: number[];
}

export type AccessResult = "autorizado" | "negado" | "duplicado" | "manual";

export interface AccessRecord {
  id: string;
  student_id: string | null;
  name: string | null;
  timestamp: string;
  date: string;
  result: AccessResult;
  similarity?: number;
}

export function isValidDescriptor(d: unknown): d is number[] {
  return (
    Array.isArray(d) &&
    d.length === DESCRIPTOR_LENGTH &&
    d.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

function distance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// ---- Cache curto da lista de participantes (cada instância do servidor tem o seu) ----

const CACHE_MS = 15_000;
let cache: { at: number; list: StoredParticipant[] } | null = null;

export function invalidateParticipants(): void {
  cache = null;
}

export async function loadParticipants(fresh = false): Promise<StoredParticipant[]> {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.list;
  const ids = await kvSmembers("students:index");
  const items = await kvMget<StoredParticipant>(ids.map((id) => `student:${id}`));
  const list = items.filter((p): p is StoredParticipant => !!p && !!p.id);
  cache = { at: Date.now(), list };
  return list;
}

export function publicParticipant(p: StoredParticipant) {
  const { face_descriptor: _omit, ...rest } = p;
  return rest;
}

export function findBestMatch(
  descriptor: number[],
  participants: StoredParticipant[]
): { participant: StoredParticipant; distance: number } | null {
  let best: StoredParticipant | null = null;
  let bestDist = Infinity;
  for (const p of participants) {
    if (!isValidDescriptor(p.face_descriptor)) continue;
    const d = distance(descriptor, p.face_descriptor);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best ? { participant: best, distance: bestDist } : null;
}

export function similarityFromDistance(d: number): number {
  return Math.max(0, Math.min(100, Math.round((1 - d) * 100)));
}

async function logAccess(record: AccessRecord): Promise<void> {
  await kvLpush(`access:${record.date}`, JSON.stringify(record));
}

export async function logDenied(similarity?: number): Promise<AccessRecord> {
  const now = new Date();
  const record: AccessRecord = {
    id: randomUUID(),
    student_id: null,
    name: null,
    timestamp: now.toISOString(),
    date: getBrazilDate(now),
    result: "negado",
    ...(similarity !== undefined ? { similarity } : {}),
  };
  await logAccess(record);
  return record;
}

/**
 * Registra a entrada do participante no dia. Só a primeira do dia vale:
 * SET NX é atômico, então duas leituras simultâneas não geram entrada dupla.
 */
export async function registerEntry(
  participant: { id: string; name: string },
  kind: "autorizado" | "manual",
  similarity?: number
): Promise<{ status: "registrado"; record: AccessRecord } | { status: "duplicado"; firstAt: string | null }> {
  const now = new Date();
  const date = getBrazilDate(now);
  const timestamp = now.toISOString();
  const cooldownKey = `cooldown:${participant.id}:${date}`;

  const first = await kvSetNx(cooldownKey, timestamp, 86400);
  if (!first) {
    const previous = await kvGet<string>(cooldownKey);
    const firstAt = typeof previous === "string" && previous.includes("T") ? previous : null;
    if (kind === "autorizado") {
      await logAccess({
        id: randomUUID(),
        student_id: participant.id,
        name: participant.name,
        timestamp,
        date,
        result: "duplicado",
        ...(similarity !== undefined ? { similarity } : {}),
      });
    }
    return { status: "duplicado", firstAt };
  }

  const record: AccessRecord = {
    id: randomUUID(),
    student_id: participant.id,
    name: participant.name,
    timestamp,
    date,
    result: kind,
    ...(similarity !== undefined ? { similarity } : {}),
  };
  const json = JSON.stringify(record);
  await Promise.all([
    logAccess(record),
    kvLpush(`attendance:${date}`, json),
    kvLpush(`attendance:student:${participant.id}`, json),
  ]);
  return { status: "registrado", record };
}

export function formatTimeBR(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}
