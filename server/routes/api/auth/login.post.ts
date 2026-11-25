import { defineEventHandler, readBody, createError } from "h3";
import { checkPassword, createSession, getAdminCredentials } from "../../../lib/auth";
import { RATE_LIMITS, enforceRateLimit } from "../../../lib/rate-limit";

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, RATE_LIMITS.login);
  if (!getAdminCredentials()) {
    throw createError({
      statusCode: 503,
      message: "Login de administrador não configurado no servidor (defina ADMIN_EMAIL e ADMIN_PASSWORD).",
    });
  }
  const body = await readBody<{ email?: unknown; password?: unknown }>(event);
  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");

  if (!email || !password) {
    throw createError({ statusCode: 400, message: "Informe e-mail e senha." });
  }
  if (!checkPassword(email, password)) {
    // Pequena espera para dificultar tentativas em sequência.
    await new Promise((r) => setTimeout(r, 600));
    throw createError({ statusCode: 401, message: "E-mail ou senha incorretos." });
  }
  createSession(event, email);
  return { success: true, email: email.trim().toLowerCase() };
});
