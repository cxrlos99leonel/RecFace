import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";

/**
 * Trata erros das chamadas do painel: sessão expirada (401) leva ao login,
 * o resto vira um aviso na tela.
 */
export function useAdminErrorHandler() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return useCallback(
    (e: unknown, fallback = "Algo deu errado. Tente novamente.") => {
      if (e instanceof ApiError && e.status === 401) {
        toast.info("Sua sessão expirou. Entre novamente.");
        navigate({ to: "/login", search: { redirect: pathname } });
        return;
      }
      toast.error(e instanceof Error ? e.message : fallback);
    },
    [navigate, pathname]
  );
}

/** Baixa um CSV (com BOM, para o Excel abrir os acentos corretamente). */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  // Textos que começam com = + - @ (ou tab/enter) viram fórmula no Excel. Como o nome
  // é digitado por qualquer pessoa na portaria, um apóstrofo os mantém como texto.
  const esc = (v: string | number) => {
    let s = String(v);
    if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const body = [header.map(esc).join(";"), ...rows.map((r) => r.map(esc).join(";"))].join("\n");
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
