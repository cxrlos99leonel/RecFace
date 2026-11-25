/**
 * Limite de tentativas por IP (janela fixa), guardado no Redis.
 *
 * Protege o login contra tentativas de senha em massa e a portaria contra
 * cadastros falsos e requisições em excesso. O IP é guardado como hash
 * (SHA-256), nunca em texto, e a chave expira sozinha ao fim da janela.
 *
 * Se o Redis falhar, a requisição segue normalmente: o limite nunca pode
 * derrubar a portaria por conta própria.
 */
import { createHash } from "node:crypto";
import { createError, getRequestIP, type H3Event } from "h3";
import { kvIncrWithExpiry } from "./storage";

export interface RateLimitRule {
  /** Nome curto da regra, usado na chave do Redis. */
  scope: string;
  /** Máximo de requisições por janela. */
  limit: number;
  /** Duração da janela, em segundos. */
  windowSeconds: number;
  /** Mensagem mostrada quando o limite estoura. */
  message: string;
}

export const RATE_LIMITS = {
  // Um administrador digitando a senha errada algumas vezes não chega perto disso.
  login: {
    scope: "login",
    limit: 10,
    windowSeconds: 15 * 60,
    message: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
  },
  // Na portaria, todos os cadastros saem do mesmo terminal (mesmo IP). Um cadastro
  // real leva cerca de um minuto (5 fotos + formulário), então 30 a cada 10 minutos
  // sobra para o uso normal e barra robôs.
  enrollment: {
    scope: "enroll",
    limit: 30,
    windowSeconds: 10 * 60,
    message: "Muitos cadastros em sequência neste terminal. Aguarde alguns minutos ou procure a equipe da entrada.",
  },
  // O terminal envia no máximo cerca de 1 leitura por segundo; 240 por minuto
  // cobre até 4 terminais atrás do mesmo IP.
  recognize: {
    scope: "recog",
    limit: 240,
    windowSeconds: 60,
    message: "Muitas leituras em sequência. Aguarde alguns segundos.",
  },
} satisfies Record<string, RateLimitRule>;

function clientKey(event: H3Event): string {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "desconhecido";
  return createHash("sha256").update(`recface-rl:${ip}`).digest("hex").slice(0, 32);
}

/** Interrompe a requisição com 429 se o IP passou do limite da regra. */
export async function enforceRateLimit(event: H3Event, rule: RateLimitRule): Promise<void> {
  const window = Math.floor(Date.now() / 1000 / rule.windowSeconds);
  const key = `ratelimit:${rule.scope}:${clientKey(event)}:${window}`;

  let count: number;
  try {
    count = await kvIncrWithExpiry(key, rule.windowSeconds);
  } catch (e) {
    console.error("[rate-limit] contador indisponível, seguindo sem limite:", e);
    return;
  }

  if (count > rule.limit) {
    const retryAfter = rule.windowSeconds - (Math.floor(Date.now() / 1000) % rule.windowSeconds);
    throw createError({
      statusCode: 429,
      message: rule.message,
      headers: { "Retry-After": String(retryAfter) },
    });
  }
}
