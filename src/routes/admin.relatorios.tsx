import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { isEntry } from "@/components/admin/AccessBadge";
import { api, type AccessRecord } from "@/lib/api";
import { downloadCsv, useAdminErrorHandler } from "@/lib/admin";
import { brazilDateDaysAgo, formatDateBR, toBrazilDate } from "@/lib/date";

export const Route = createFileRoute("/admin/relatorios")({
  component: ReportsPage,
});

const MAX_DAYS = 62;

interface DayRow {
  date: string;
  entries: number;
  manual: number;
  denied: number;
  duplicates: number;
}

interface PersonRow {
  id: string;
  name: string;
  document: string;
  days: number;
  pct: number;
  last: string | null;
}

function daysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(`${start}T12:00:00Z`);
  const last = new Date(`${end}T12:00:00Z`);
  while (d <= last && out.length <= MAX_DAYS) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

function ReportsPage() {
  const onError = useAdminErrorHandler();
  const [period, setPeriod] = useState<"7" | "30" | "custom">("7");
  const [from, setFrom] = useState(brazilDateDaysAgo(6));
  const [to, setTo] = useState(toBrazilDate());
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<DayRow[] | null>(null);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [summary, setSummary] = useState("");

  function range(): [string, string] | null {
    if (period === "7") return [brazilDateDaysAgo(6), toBrazilDate()];
    if (period === "30") return [brazilDateDaysAgo(29), toBrazilDate()];
    if (!from || !to) return null;
    return from <= to ? [from, to] : [to, from];
  }

  async function generate() {
    const r = range();
    if (!r) return toast.error("Escolha a data de início e a de fim.");
    const dates = daysBetween(r[0], r[1]);
    if (dates.length > MAX_DAYS) return toast.error(`Escolha um período de até ${MAX_DAYS} dias.`);
    setLoading(true);
    try {
      const [participants, ...results] = await Promise.all([
        api.listParticipants(),
        ...dates.map((d) => api.accessByDate(d)),
      ]);
      const dayRows: DayRow[] = [];
      const presence = new Map<string, { days: Set<string>; last: string }>();
      results.forEach((res, i) => {
        const recs: AccessRecord[] = res.records;
        const entries = recs.filter((x) => isEntry(x.result));
        dayRows.push({
          date: dates[i],
          entries: entries.length,
          manual: entries.filter((x) => x.result === "manual").length,
          denied: recs.filter((x) => x.result === "negado").length,
          duplicates: recs.filter((x) => x.result === "duplicado").length,
        });
        for (const e of entries) {
          if (!e.student_id || e.removed) continue;
          const cur = presence.get(e.student_id) ?? { days: new Set<string>(), last: e.timestamp };
          cur.days.add(dates[i]);
          if (e.timestamp > cur.last) cur.last = e.timestamp;
          presence.set(e.student_id, cur);
        }
      });
      const activeDays = dayRows.filter((d) => d.entries > 0).length;
      setDays(dayRows.reverse());
      setPeople(
        participants.students
          .map((p) => {
            const pr = presence.get(p.id);
            const n = pr?.days.size ?? 0;
            return {
              id: p.id,
              name: p.name,
              document: p.registration_id,
              days: n,
              pct: activeDays ? Math.round((n / activeDays) * 100) : 0,
              last: pr?.last ?? null,
            };
          })
          .sort((a, b) => b.days - a.days || a.name.localeCompare(b.name, "pt-BR"))
      );
      const total = dayRows.reduce((s, d) => s + d.entries, 0);
      setSummary(
        `${formatDateBR(r[0])} a ${formatDateBR(r[1])} · ${total} entrada(s) em ${activeDays} dia(s) com movimento.`
      );
    } catch (e) {
      onError(e, "Não foi possível gerar o relatório.");
    } finally {
      setLoading(false);
    }
  }

  const tabBtn = (k: typeof period, label: string) => (
    <button
      type="button"
      aria-pressed={period === k}
      onClick={() => setPeriod(k)}
      className={`rounded-full px-4 py-2.5 text-sm font-semibold ${period === k ? "bg-tinta text-lima" : "hover:bg-white"}`}
    >
      {label}
    </button>
  );

  return (
    <>
      <AdminHeader title="Relatórios" subtitle="Movimento da entrada por período" />

      <section className="flex flex-wrap items-end gap-4 rounded-[28px] bg-white p-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Período</span>
          <div className="flex flex-wrap gap-1 rounded-full bg-nevoa p-1" role="group" aria-label="Período">
            {tabBtn("7", "Últimos 7 dias")}
            {tabBtn("30", "Últimos 30 dias")}
            {tabBtn("custom", "Escolher datas")}
          </div>
        </div>
        {period === "custom" && (
          <>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              De
              <input type="date" value={from} max={toBrazilDate()} onChange={(e) => setFrom(e.target.value)} className="rf-input rf-input-outline" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              Até
              <input type="date" value={to} max={toBrazilDate()} onChange={(e) => setTo(e.target.value)} className="rf-input rf-input-outline" />
            </label>
          </>
        )}
        <button type="button" onClick={generate} disabled={loading} className="rounded-full bg-tinta px-6 py-3.5 font-semibold text-lima disabled:opacity-50">
          {loading ? "Gerando…" : "Gerar relatório"}
        </button>
      </section>

      {days === null ? (
        <section className="rounded-[28px] bg-white p-10 text-center text-cinza">Escolha um período e clique em “Gerar relatório”.</section>
      ) : (
        <>
          <p className="px-2 text-[15px] font-medium" aria-live="polite">
            {summary}
          </p>
          <section className="rounded-[28px] bg-white p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold">Por dia</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv("relatorio-por-dia.csv", ["Data", "Entradas", "Liberações manuais", "Negadas", "Duplicadas"], days.map((d) => [formatDateBR(d.date), d.entries, d.manual, d.denied, d.duplicates]))
                  }
                  className="rounded-full bg-nevoa px-4 py-2.5 text-sm font-semibold hover:bg-borda"
                >
                  CSV
                </button>
                <button type="button" onClick={() => window.print()} className="rounded-full bg-nevoa px-4 py-2.5 text-sm font-semibold hover:bg-borda">
                  Imprimir
                </button>
              </div>
            </div>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela de entradas por dia (role para os lados)">
              <table className="w-full min-w-[520px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-left text-[13px] text-cinza">
                    <th className="px-2 py-3 font-semibold">Data</th>
                    <th className="px-2 py-3 text-right font-semibold">Entradas</th>
                    <th className="px-2 py-3 text-right font-semibold">Manuais</th>
                    <th className="px-2 py-3 text-right font-semibold">Negadas</th>
                    <th className="px-2 py-3 text-right font-semibold">Duplicadas</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d.date} className={`border-t border-nevoa tabular-nums ${d.entries || d.denied ? "" : "text-cinza"}`}>
                      <td className="px-2 py-3">{formatDateBR(d.date)}</td>
                      <td className="px-2 py-3 text-right font-semibold">{d.entries}</td>
                      <td className="px-2 py-3 text-right">{d.manual}</td>
                      <td className={`px-2 py-3 text-right ${d.denied ? "font-semibold text-negado" : ""}`}>{d.denied}</td>
                      <td className="px-2 py-3 text-right">{d.duplicates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold">Por participante</h2>
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    "relatorio-por-participante.csv",
                    ["Nome", "Documento", "Dias com entrada", "Frequência", "Última entrada"],
                    people.map((p) => [p.name, p.document, p.days, `${p.pct}%`, p.last ? new Date(p.last).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : ""])
                  )
                }
                className="rounded-full bg-nevoa px-4 py-2.5 text-sm font-semibold hover:bg-borda"
              >
                CSV
              </button>
            </div>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela de frequência por participante (role para os lados)">
              <table className="w-full min-w-[560px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-left text-[13px] text-cinza">
                    <th className="px-2 py-3 font-semibold">Participante</th>
                    <th className="px-2 py-3 font-semibold">Documento</th>
                    <th className="px-2 py-3 text-right font-semibold">Dias com entrada</th>
                    <th className="px-2 py-3 font-semibold">Frequência</th>
                  </tr>
                </thead>
                <tbody>
                  {people.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2 py-8 text-center text-cinza">
                        Nenhum participante cadastrado.
                      </td>
                    </tr>
                  )}
                  {people.map((p) => (
                    <tr key={p.id} className="border-t border-nevoa">
                      <td className="px-2 py-3 font-semibold">{p.name}</td>
                      <td className="px-2 py-3 tabular-nums">{p.document}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{p.days}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-28 overflow-hidden rounded-full bg-nevoa" aria-hidden="true">
                            <span className="block h-full rounded-full bg-scan" style={{ width: `${p.pct}%` }} />
                          </span>
                          <span className="tabular-nums">{p.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[13px] text-cinza">Frequência = dias em que a pessoa entrou ÷ dias do período em que houve alguma entrada.</p>
          </section>
        </>
      )}
    </>
  );
}
