import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço da versão anterior: o cadastro agora fica na portaria.
export const Route = createFileRoute("/enroll")({
  beforeLoad: () => {
    throw redirect({ to: "/plataforma", search: { modo: "cadastro" }, replace: true });
  },
});
