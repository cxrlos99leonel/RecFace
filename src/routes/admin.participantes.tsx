import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { isEntry } from "@/components/admin/AccessBadge";
import { api, type Participant } from "@/lib/api";
import { downloadCsv, useAdminErrorHandler } from "@/lib/admin";
import { formatTimeBR, toBrazilDate } from "@/lib/date";

export const Route = createFileRoute("/admin/participantes")({
  component: ParticipantsPage,
});

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function ParticipantsPage() {
  const onError = useAdminErrorHandler();
  const [list, setList] = useState<Participant[]>([]);
  const [enteredAt, setEnteredAt] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<Participant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [releasing, setReleasing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([api.listParticipants(), api.accessByDate(toBrazilDate())]);
      setList(p.students);
      const map = new Map<string, string>();
      // Lista vem da mais recente para a mais antiga: a última gravada é a primeira entrada do dia.
      for (const r of a.records) if (isEntry(r.result) && r.student_id) map.set(r.student_id, r.timestamp);
      setEnteredAt(map);
    } catch (e) {
      onError(e, "Não foi possível carregar os participantes.");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return list;
    return list.filter((p) => normalize(p.name).includes(q) || normalize(p.registration_id).includes(q));
  }, [list, query]);

  async function release(p: Participant) {
    setReleasing(p.id);
    try {
      const res = await api.manualEntry(p.id);
      if (res.success) toast.success(res.message);
      else toast.info(res.message);
      await load();
    } catch (e) {
      onError(e);
    } finally {
      setReleasing(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await api.deleteParticipant(toDelete.id);
      toast.success(res.message);
      setList((prev) => prev.filter((p) => p.id !== toDelete.id));
      setToDelete(null);
    } catch (e) {
      onError(e);
    } finally {
      setDeleting(false);
    }
  }

  function exportCsv() {
    downloadCsv(
      "participantes.csv",
      ["Nome", "Documento", "E-mail", "Cadastrado em", "Entrada hoje"],
      filtered.map((p) => [
        p.name,
        p.registration_id,
        p.email && !p.email.endsWith("@sememail.local") ? p.email : "",
        new Date(p.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        enteredAt.has(p.id) ? formatTimeBR(enteredAt.get(p.id)!) : "",
      ])
    );
  }

  return (
    <>
      <AdminHeader title="Participantes" subtitle={loading ? "Carregando…" : `${list.length} cadastrado(s) · ${list.filter((p) => enteredAt.has(p.id)).length} entraram hoje`}>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!filtered.length}
          className="rounded-full bg-nevoa px-5 py-3 text-sm font-semibold hover:bg-borda disabled:opacity-40"
        >
          Exportar CSV
        </button>
        <Link to="/plataforma" search={{ modo: "cadastro" }} className="rounded-full bg-tinta px-5 py-3 text-sm font-semibold text-lima">
          + Novo cadastro
        </Link>
      </AdminHeader>

      <section className="rounded-[28px] bg-white p-6">
        <label className="relative mb-4 block max-w-md">
          <span className="sr-only">Buscar participante</span>
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cinza" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou documento"
            className="rf-input rf-input-outline pl-11"
          />
        </label>

        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela de participantes (role para os lados)">
          <table className="w-full min-w-[640px] border-collapse text-[15px]">
            <thead>
              <tr className="text-left text-[13px] text-cinza">
                <th className="px-2 py-3 font-semibold">Nome</th>
                <th className="px-2 py-3 font-semibold">Documento</th>
                <th className="px-2 py-3 font-semibold">Cadastro</th>
                <th className="px-2 py-3 font-semibold">Hoje</th>
                <th className="px-2 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-10 text-center text-cinza">
                    {list.length ? "Ninguém encontrado com essa busca." : "Nenhum participante cadastrado ainda."}
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const at = enteredAt.get(p.id);
                return (
                  <tr key={p.id} className="border-t border-nevoa">
                    <td className="px-2 py-3.5">
                      <strong className="block">{p.name}</strong>
                      {p.email && !p.email.endsWith("@sememail.local") && <span className="text-[13px] text-cinza">{p.email}</span>}
                    </td>
                    <td className="px-2 py-3.5 tabular-nums">{p.registration_id}</td>
                    <td className="px-2 py-3.5 text-cinza">
                      {new Date(p.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    </td>
                    <td className="px-2 py-3.5">
                      {at ? (
                        <span className="rounded-full bg-lima px-3 py-1.5 text-[13px] font-semibold">Entrou {formatTimeBR(at).slice(0, 5)}</span>
                      ) : (
                        <span className="text-cinza">-</span>
                      )}
                    </td>
                    <td className="px-2 py-3.5">
                      <div className="flex justify-end gap-2">
                        {!at && (
                          <button
                            type="button"
                            onClick={() => release(p)}
                            disabled={releasing === p.id}
                            className="whitespace-nowrap rounded-full bg-ambar px-4 py-2.5 text-[13px] font-semibold text-tinta disabled:opacity-50"
                            title="Liberar a entrada sem reconhecimento facial"
                          >
                            {releasing === p.id ? "Liberando…" : "Liberar entrada"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setToDelete(p)}
                          aria-label={`Excluir ${p.name}`}
                          className="grid h-10 w-10 place-items-center rounded-xl bg-nevoa hover:bg-negado hover:text-white"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-[28px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">Excluir participante</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir <strong>{toDelete?.name}</strong>? O cadastro facial e o histórico de entradas serão apagados. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-full">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="rounded-full bg-negado text-white hover:bg-negado/90"
            >
              {deleting ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
