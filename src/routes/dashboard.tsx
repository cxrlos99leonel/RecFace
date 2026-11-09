import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço da versão anterior: o painel agora fica em /admin.
export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/admin", replace: true });
  },
});
