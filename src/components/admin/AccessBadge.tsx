import type { AccessResult } from "@/lib/api";

const MAP: Record<AccessResult, { label: string; className: string }> = {
  autorizado: { label: "Liberado", className: "bg-lima text-tinta" },
  manual: { label: "Liberação manual", className: "bg-ambar text-tinta" },
  negado: { label: "Negado", className: "bg-negado text-white" },
  duplicado: { label: "Já havia entrado", className: "bg-borda text-tinta" },
};

export function AccessBadge({ result }: { result: AccessResult }) {
  const m = MAP[result] ?? MAP.negado;
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ${m.className}`}>
      {m.label}
    </span>
  );
}

export function isEntry(result: AccessResult): boolean {
  return result === "autorizado" || result === "manual";
}
