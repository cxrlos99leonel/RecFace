/**
 * Camada de armazenamento.
 * Em produção: Redis (Upstash) via @vercel/kv.
 * Em desenvolvimento local sem variáveis de ambiente: Map em memória.
 */
import { createError } from "h3";
import type { VercelKV } from "@vercel/kv";

const env = typeof process !== "undefined" ? process.env : ({} as Record<string, string | undefined>);

const KV_URL = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;

const HAS_KV = !!KV_URL && !!KV_TOKEN;
const IS_PRODUCTION = !!env.VERCEL;

let client: VercelKV | null = null;

async function getKv(): Promise<VercelKV> {
  if (!client) {
    const { createClient } = await import("@vercel/kv");
    client = createClient({ url: KV_URL!, token: KV_TOKEN! });
  }
  return client;
}

/** Executa uma operação no Redis, convertendo falhas de conexão em erro 503 legível. */
async function withKv<T>(fn: (kv: VercelKV) => Promise<T>): Promise<T> {
  try {
    return await fn(await getKv());
  } catch (e) {
    console.error("[storage] falha no Redis:", e);
    throw createError({
      statusCode: 503,
      message: "Banco de dados indisponível no momento. Tente novamente em instantes.",
    });
  }
}

/**
 * Em produção, nunca cair para memória: cada instância serverless teria seus
 * próprios dados e eles sumiriam entre requisições.
 */
function useMemory(): boolean {
  if (HAS_KV) return false;
  if (IS_PRODUCTION) {
    throw createError({
      statusCode: 503,
      message: "Banco de dados não configurado no servidor.",
    });
  }
  return true;
}

// ---- Fallback em memória (desenvolvimento local) ----

const mem: Map<string, unknown> = new Map();

function memSet(key: string, value: unknown, exSeconds?: number): void {
  mem.set(key, value);
  if (exSeconds) setTimeout(() => mem.delete(key), exSeconds * 1000);
}

function memSetOf(key: string): Set<string> {
  const set = (mem.get(key) as Set<string>) ?? new Set<string>();
  mem.set(key, set);
  return set;
}

function memList(key: string): string[] {
  const list = (mem.get(key) as string[]) ?? [];
  mem.set(key, list);
  return list;
}

// ---- API unificada ----

export async function kvGet<T>(key: string): Promise<T | null> {
  if (useMemory()) return (mem.get(key) as T) ?? null;
  return withKv((kv) => kv.get<T>(key));
}

/** Lê várias chaves de uma vez (uma única chamada ao Redis). */
export async function kvMget<T>(keys: string[]): Promise<(T | null)[]> {
  if (!keys.length) return [];
  if (useMemory()) return keys.map((k) => (mem.get(k) as T) ?? null);
  return withKv((kv) => kv.mget<(T | null)[]>(...keys));
}

export async function kvSet(key: string, value: unknown, opts?: { ex?: number }): Promise<void> {
  if (useMemory()) return memSet(key, value, opts?.ex);
  await withKv((kv) => (opts?.ex ? kv.set(key, value, { ex: opts.ex }) : kv.set(key, value)));
}

/** Grava apenas se a chave não existir. Retorna true se gravou. */
export async function kvSetNx(key: string, value: unknown, exSeconds: number): Promise<boolean> {
  if (useMemory()) {
    if (mem.has(key)) return false;
    memSet(key, value, exSeconds);
    return true;
  }
  const res = await withKv((kv) => kv.set(key, value, { nx: true, ex: exSeconds }));
  return res === "OK";
}

export async function kvSadd(key: string, ...values: string[]): Promise<void> {
  if (useMemory()) {
    const set = memSetOf(key);
    values.forEach((v) => set.add(v));
    return;
  }
  await withKv((kv) => kv.sadd(key, values[0], ...values.slice(1)));
}

export async function kvSmembers(key: string): Promise<string[]> {
  if (useMemory()) return [...memSetOf(key)];
  return withKv((kv) => kv.smembers(key));
}

export async function kvSrem(key: string, ...values: string[]): Promise<void> {
  if (useMemory()) {
    const set = memSetOf(key);
    values.forEach((v) => set.delete(v));
    return;
  }
  await withKv((kv) => kv.srem(key, ...values));
}

export async function kvLpush(key: string, ...values: string[]): Promise<void> {
  if (useMemory()) {
    memList(key).unshift(...values);
    return;
  }
  await withKv((kv) => kv.lpush(key, ...values));
}

export async function kvLrange(key: string, start: number, stop: number): Promise<string[]> {
  if (useMemory()) {
    const end = stop === -1 ? undefined : stop + 1;
    return memList(key).slice(start, end);
  }
  // @vercel/kv já devolve objetos desserializados; normaliza para string JSON.
  const values = await withKv((kv) => kv.lrange(key, start, stop));
  return values.map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
}

/**
 * Incrementa um contador e define o prazo de expiração na primeira chamada.
 * Retorna o novo valor. Usado pelo limite de tentativas (rate-limit.ts).
 */
export async function kvIncrWithExpiry(key: string, exSeconds: number): Promise<number> {
  if (useMemory()) {
    const next = ((mem.get(key) as number | undefined) ?? 0) + 1;
    if (next === 1) memSet(key, next, exSeconds);
    else mem.set(key, next);
    return next;
  }
  return withKv(async (kv) => {
    const value = await kv.incr(key);
    if (value === 1) await kv.expire(key, exSeconds);
    return value;
  });
}

export async function kvExists(key: string): Promise<boolean> {
  if (useMemory()) return mem.has(key);
  return withKv(async (kv) => (await kv.exists(key)) > 0);
}

export async function kvDel(key: string): Promise<void> {
  if (useMemory()) {
    mem.delete(key);
    return;
  }
  await withKv((kv) => kv.del(key));
}
