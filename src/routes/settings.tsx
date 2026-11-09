import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço da versão anterior.
export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    throw redirect({ to: "/admin", replace: true });
  },
});
