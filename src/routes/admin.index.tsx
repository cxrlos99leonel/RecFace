import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AccessBadge, isEntry } from "@/components/admin/AccessBadge";
import { api, type AccessRecord } from "@/lib/api";
import { downloadCsv, useAdminErrorHandler } from "@/lib/admin";
import { formatDateBR, formatTimeBR, toBrazilDate } from "@/lib/date";

export const Route = createFileRoute("/admin/")({
  component: OverviewPage,
});

type Filter = "todos" | "liberados" | "negados" | "duplicados";

const longDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function hourBR(iso: string): number {
  return Number(
    new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false })
  );
}

function OverviewPage() {
  const onError = useAdminErrorHandler();
  const today = toBrazilDate();
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<AccessRecord[]>([]);
  const [participantsTotal, setParticipantsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("todos");
  const isToday = date === today;

  const load = useCallback(
    async (d: string, quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const res = await api.accessByDate(d);
        setRecords(res.records);
        setParticipantsTotal(res.participants_total);
        setFailed(false);
      } catch (e) {
        setFailed(true);
        if (!quiet) onError(e, "Não foi possível carregar os acessos.");
      } finally {
        setLoading(false);
      }
    },
    [onError]
  );

  useEffect(() => {
    load(date);
    if (date !== today) return;
    const t = window.setInterval(() => load(date, true), 10_000);
    return () => window.clearInterval(t);
  }, [date, today, load]);

  const stats = useMemo(() => {
    const entries = records.filter((r) => isEntry(r.result));
    const enteredIds = new Set(entries.filter((r) => !r.removed).map((r) => r.student_id));
    return {
      entries: entries.length,
      manual: entries.filter((r) => r.result === "manual").length,
      denied: records.filter((r) => r.result === "negado").length,
      pending: Math.max(0, participantsTotal - enteredIds.size),
    };
  }, [records, participantsTotal]);

  const byHour = useMemo(() => {
    const counts = new Map<number, number>();
    for (const r of records) if (isEntry(r.result)) counts.set(hourBR(r.timestamp), (counts.get(hourBR(r.timestamp)) ?? 0) + 1);
    if (!counts.size) return [];
    const hours = [...counts.keys()];
    let start = Math.max(0, Math.min(...hours) - 1);
    let end = Math.min(23, Math.max(...hours) + 1);
    while (end - start < 6) {
      if (start > 0) start--;
      else if (end < 23) end++;
      else break;
    }
    const max = Math.max(...counts.values());
    return Array.from({ length: end - start + 1 }, (_, i) => {
      const h = start + i;
      const n = counts.get(h) ?? 0;
      return { h, n, pct: (n / max) * 100, peak: n === max };
    });
  }, [records]);

  const rows = useMemo(
    () =>
      records.filter((r) =>
        filter === "liberados" ? isEntry(r.result) : filter === "negados" ? r.result === "negado" : filter === "duplicados" ? r.result === "duplicado" : true
      ),
    [records, filter]
  );

  function exportCsv() {
    downloadCsv(
      `acessos-${formatDateBR(date).replace(/\//g, "-")}.csv`,
      ["Data", "Horário", "Participante", "Resultado", "Semelhança"],
      rows.map((r) => [
        formatDateBR(date),
        formatTimeBR(r.timestamp),
        r.name ?? "Rosto não reconhecido",
        { autorizado: "Liberado", manual: "Liberação manual", negado: "Negado", duplicado: "Já havia entrado" }[r.result],
        r.similarity !== undefined ? `${r.similarity}%` : "",
      ])
    );
  }

  const [y, m, d] = date.split("-").map(Number);
  const subtitle = longDate.format(new Date(Date.UTC(y, m - 1, d)));

  return (
    <>
      <AdminHeader title="Visão geral" subtitle={subtitle.charAt(0).toUpperCase() + subtitle.slice(1)}>
        <label className="flex items-center gap-2 rounded-full bg-nevoa pl-4 pr-2 text-sm font-semibold">
          Data
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="rounded-full bg-transparent px-2 py-3 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-scan"
          />
        </label>
        {!isToday && (
          <button type="button" onClick={() => setDate(today)} className="rounded-full px-4 py-3 text-sm font-semibold text-scan hover:underline">
            Ir para hoje
          </button>
        )}
        <button
          type="button"
          onClick={exportCsv}
          disabled={!rows.length}
          className="inline-flex items-center gap-2 rounded-full bg-tinta px-5 py-3 text-sm font-semibold text-lima disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" />
          </svg>
          Exportar CSV
        </button>
      </AdminHeader>

      {failed && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-white p-4 text-sm">
          <span className="font-medium text-negado">Não foi possível carregar os dados.</span>
          <button type="button" onClick={() => load(date)} className="font-semibold text-scan hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat dark label="Entradas liberadas" value={stats.entries} note={stats.manual ? `${stats.manual} manual(is)` : isToday ? "hoje" : "no dia"} />
        <Stat label="Participantes cadastrados" value={participantsTotal} note="no total" />
        <Stat label="Ainda não entraram" value={stats.pending} note="dos cadastrados" />
        <Stat label="Tentativas negadas" value={stats.denied} note="rostos não reconhecidos" danger />
      </div>

      <section className="rounded-[28px] bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-extrabold">Entradas por hora</h2>
          <span className="text-[13px] text-cinza">{isToday ? "atualiza a cada 10 s" : formatDateBR(date)}</span>
        </div>
        {byHour.length === 0 ? (
          <p className="py-10 text-center text-cinza">{loading ? "Carregando…" : "Nenhuma entrada neste dia."}</p>
        ) : (
          <>
            <div className="flex h-[200px] items-end gap-2 border-b border-borda pb-1 sm:gap-2.5" role="img" aria-label={`Entradas por hora: ${byHour.filter((b) => b.n).map((b) => `${b.h}h ${b.n}`).join(", ")}`}>
              {byHour.map((b) => (
                <div key={b.h} className="flex h-full flex-1 flex-col justify-end gap-1 text-center">
                  {b.n > 0 && <span className="text-xs font-semibold text-cinza">{b.n}</span>}
                  <span
                    className={`block rounded-t-[10px] rounded-b-[3px] ${b.peak ? "bg-scan" : "bg-scan/30"}`}
                    style={{ height: `${Math.max(b.pct, b.n ? 4 : 1.5)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2 text-xs text-cinza sm:gap-2.5" aria-hidden="true">
              {byHour.map((b) => (
                <span key={b.h} className="flex-1 text-center">
                  {b.h}h
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="rounded-[28px] bg-white p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold">Registro de acessos</h2>
          <div className="flex flex-wrap gap-1 rounded-full bg-nevoa p-1" role="group" aria-label="Filtrar registros">
            {(
              [
                ["todos", "Todos"],
                ["liberados", "Liberados"],
                ["negados", "Negados"],
                ["duplicados", "Duplicados"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-3.5 py-2.5 text-sm font-semibold ${filter === k ? "bg-tinta text-lima" : "hover:bg-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela de acessos (role para os lados)">
          <table className="w-full min-w-[560px] border-collapse text-[15px]">
            <thead>
              <tr className="text-left text-[13px] text-cinza">
                <th className="px-2 py-3 font-semibold">Horário</th>
                <th className="px-2 py-3 font-semibold">Participante</th>
                <th className="px-2 py-3 font-semibold">Semelhança</th>
                <th className="px-2 py-3 font-semibold">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-10 text-center text-cinza">
                    {loading ? "Carregando…" : records.length ? "Nenhum registro neste filtro." : "Nenhum acesso registrado neste dia."}
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-nevoa">
                  <td className="px-2 py-3.5 tabular-nums">{formatTimeBR(r.timestamp)}</td>
                  <td className={`px-2 py-3.5 ${r.name && !r.removed ? "font-semibold" : "text-cinza"}`}>{r.name ?? "Rosto não reconhecido"}</td>
                  <td className="px-2 py-3.5 tabular-nums">{r.similarity !== undefined && r.result !== "negado" ? `${r.similarity}%` : "-"}</td>
                  <td className="px-2 py-3.5">
                    <AccessBadge result={r.result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-cinza">
          Rosto não reconhecido? Libere a entrada pelo nome em{" "}
          <Link to="/admin/participantes" className="font-semibold text-scan hover:underline">
            Participantes
          </Link>
          .
        </p>
      </section>
    </>
  );
}

function Stat({ label, value, note, dark = false, danger = false }: { label: string; value: number; note: string; dark?: boolean; danger?: boolean }) {
  return (
    <div className={`flex flex-col gap-2 rounded-3xl p-5 ${dark ? "bg-tinta text-nevoa" : "bg-white"}`}>
      <span className={`text-sm ${dark ? "text-[#C5CAD6]" : "text-cinza"}`}>{label}</span>
      <span className={`font-display text-5xl font-black leading-none tabular-nums ${dark ? "text-lima" : danger && value > 0 ? "text-negado" : ""}`}>{value}</span>
      <span className={`text-[13px] ${dark ? "text-[#9AA3B5]" : "text-cinza"}`}>{note}</span>
    </div>
  );
}
