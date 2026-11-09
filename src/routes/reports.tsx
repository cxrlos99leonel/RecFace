import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço da versão anterior: os relatórios agora ficam no painel.
export const Route = createFileRoute("/reports")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/relatorios", replace: true });
  },
});
