/**
 * Login do administrador.
 *
 * Credenciais vêm das variáveis de ambiente ADMIN_EMAIL e ADMIN_PASSWORD
 * (configuradas na Vercel). Em desenvolvimento local, sem essas variáveis,
 * vale o acesso de teste admin@recface.local / recface123.
 *
 * A sessão é um cookie httpOnly assinado com HMAC-SHA256, válido por 8 horas.
 */
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { createError, getCookie, setCookie, deleteCookie, type H3Event } from "h3";

const env = typeof process !== "undefined" ? process.env : ({} as Record<string, string | undefined>);

export const SESSION_COOKIE = "recface_admin";
const SESSION_HOURS = 8;

const DEV_EMAIL = "admin@recface.local";
const DEV_PASSWORD = "recface123";

interface Credentials {
  email: string;
  password: string;
}

function isProduction(): boolean {
  return !!env.VERCEL || env.NODE_ENV === "production";
}

/** Credenciais válidas, ou null se o servidor de produção não tiver sido configurado. */
export function getAdminCredentials(): Credentials | null {
  const email = env.ADMIN_EMAIL?.trim();
  const password = env.ADMIN_PASSWORD;
  if (email && password) return { email: email.toLowerCase(), password };
  if (isProduction()) return null;
  return { email: DEV_EMAIL, password: DEV_PASSWORD };
}

function sessionSecret(creds: Credentials): string {
  // Trocar a senha invalida todas as sessões abertas.
  return env.ADMIN_SESSION_SECRET || createHash("sha256").update(`recface:${creds.email}:${creds.password}`).digest("hex");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Compara mesmo assim para não revelar o tamanho pelo tempo de resposta.
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export function checkPassword(email: string, password: string): boolean {
  const creds = getAdminCredentials();
  if (!creds) return false;
  const emailOk = safeEqual(email.trim().toLowerCase(), creds.email);
  const passOk = safeEqual(password, creds.password);
  return emailOk && passOk;
}

export function createSession(event: H3Event, email: string): void {
  const creds = getAdminCredentials()!;
  const payload = Buffer.from(
    JSON.stringify({ e: email.trim().toLowerCase(), x: Date.now() + SESSION_HOURS * 3600_000 })
  ).toString("base64url");
  const token = `${payload}.${sign(payload, sessionSecret(creds))}`;
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export function clearSession(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: "/" });
}

/** E-mail do administrador logado, ou null. */
export function getSession(event: H3Event): { email: string; expiresAt: number } | null {
  const creds = getAdminCredentials();
  if (!creds) return null;
  const token = getCookie(event, SESSION_COOKIE);
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload, sessionSecret(creds)))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { e: string; x: number };
    if (typeof data.x !== "number" || data.x < Date.now()) return null;
    if (data.e !== creds.email) return null;
    return { email: data.e, expiresAt: data.x };
  } catch {
    return null;
  }
}

/** Interrompe a requisição com 401 se não houver administrador logado. */
export function requireAdmin(event: H3Event): { email: string } {
  const session = getSession(event);
  if (!session) {
    throw createError({ statusCode: 401, message: "Faça login como administrador para continuar." });
  }
  return session;
}
