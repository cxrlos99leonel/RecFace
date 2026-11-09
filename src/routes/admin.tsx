import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { LogoMark } from "@/components/brand";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel do administrador | RecFace" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV: { to: "/admin" | "/admin/participantes" | "/admin/relatorios"; label: string; icon: ReactNode }[] = [
  {
    to: "/admin",
    label: "Visão geral",
    icon: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  },
  {
    to: "/admin/participantes",
    label: "Participantes",
    icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></>,
  },
  {
    to: "/admin/relatorios",
    label: "Relatórios",
    icon: <><path d="M3 3v18h18" /><path d="M7 16V9" /><path d="M12 16V5" /><path d="M17 16v-4" /></>,
  },
];

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string | null>(null);

  // Proteção da área: sem sessão válida, vai para o login.
  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((r) => !cancelled && setEmail(r.email))
      .catch((e) => {
        if (cancelled) return;
        if (!(e instanceof ApiError && e.status === 401)) toast.error(e instanceof Error ? e.message : String(e));
        navigate({ to: "/login", search: { redirect: pathname }, replace: true });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    try {
      await api.logout();
    } finally {
      navigate({ to: "/login", replace: true });
    }
  }

  if (!email) {
    return (
      <div className="grid min-h-screen place-items-center bg-nevoa text-cinza" role="status">
        Verificando acesso…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-wrap items-start gap-4 bg-nevoa p-3 text-tinta sm:p-4">
      <aside className="flex w-full flex-col gap-6 rounded-[28px] bg-tinta p-5 text-nevoa lg:sticky lg:top-4 lg:min-h-[calc(100vh-2rem)] lg:w-[240px]">
        <Link to="/" className="flex items-center gap-2.5" aria-label="RecFace, página inicial">
          <LogoMark inverted />
          <span className="font-display text-xl font-black">RecFace</span>
        </Link>
        <nav aria-label="Painel" className="flex flex-wrap gap-1 text-[15px] lg:flex-col">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="flex items-center gap-2.5 rounded-[14px] px-3.5 py-3 text-nevoa hover:bg-grafite"
              activeProps={{ className: "!bg-lima !text-tinta font-semibold" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {n.icon}
              </svg>
              {n.label}
            </Link>
          ))}
          <Link to="/plataforma" className="flex items-center gap-2.5 rounded-[14px] px-3.5 py-3 text-nevoa hover:bg-grafite">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="11" r="3" />
            </svg>
            Abrir portaria
          </Link>
        </nav>
        <div className="flex flex-col gap-2 rounded-[18px] bg-grafite p-4 lg:mt-auto">
          <span className="text-[13px] text-[#9AA3B5]">Conectado como</span>
          <strong className="truncate text-[15px]" title={email}>
            {email}
          </strong>
          <button type="button" onClick={logout} className="self-start text-sm font-semibold text-lima hover:underline">
            Sair
          </button>
        </div>
      </aside>
      <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-4">
        <Outlet />
      </main>
    </div>
  );
}
