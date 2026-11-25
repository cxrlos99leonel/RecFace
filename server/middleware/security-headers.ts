/**
 * Cabeçalhos de segurança em todas as respostas do servidor (páginas e API).
 *
 * - Impede que o site seja embutido em outra página (clickjacking no painel).
 * - Câmera liberada só para o próprio site; microfone e localização bloqueados.
 * - Força HTTPS no navegador depois da primeira visita.
 *
 * A política de conteúdo é propositalmente enxuta (sem script-src): o
 * reconhecimento facial usa TensorFlow.js/WebAssembly e o TanStack Start
 * injeta scripts na página, e uma regra mais rígida quebraria a portaria.
 */
import { defineEventHandler, setResponseHeaders } from "h3";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  "Cross-Origin-Opener-Policy": "same-origin",
};

export default defineEventHandler((event) => {
  setResponseHeaders(event, SECURITY_HEADERS);
});
