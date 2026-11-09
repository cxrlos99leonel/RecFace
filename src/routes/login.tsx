import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand";
import { api } from "@/lib/api";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const r = typeof search.redirect === "string" ? search.redirect : undefined;
    // Só aceita voltar para páginas do próprio painel.
    return r && r.startsWith("/admin") ? { redirect: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Login do administrador | RecFace" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goNext = () => navigate({ to: redirect ?? "/admin", replace: true });

  // Já logado? Vai direto para o painel.
  useEffect(() => {
    api.me().then(goNext).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Lê direto do formulário: funciona mesmo se o navegador preencheu os campos
    // (preenchimento automático) antes de a página terminar de carregar.
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!email || !password) {
      setError("Informe o usuário e a senha.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.login(email, password);
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-wrap gap-5 bg-nevoa p-3 text-tinta sm:p-5">
      <section className="relative flex min-h-[420px] min-w-0 flex-[1_1_520px] flex-col justify-between gap-12 overflow-hidden rounded-[36px] bg-tinta p-[clamp(28px,5vw,56px)] text-nevoa">
        <svg aria-hidden="true" viewBox="0 0 600 800" preserveAspectRatio="none" className="pointer-events-none absolute bottom-0 right-0 h-[70%] w-[70%]">
          <polygon points="600,120 600,800 120,800 380,420 260,440" fill="#1C2333" />
          <polygon points="600,560 600,640 470,800 400,800" fill="#C6F432" />
        </svg>
        <div className="relative">
          <Logo inverted className="h-[34px]" />
        </div>
        <div className="relative">
          <h1 className="font-display text-[clamp(52px,7vw,104px)] font-bold leading-[0.95]">
            Área do
            <br />
            <span className="text-lima">admin.</span>
          </h1>
          <p className="mt-6 max-w-[420px] text-lg leading-relaxed text-[#C5CAD6]">
            Acompanhe as entradas em tempo real, gerencie participantes e exporte relatórios do seu evento.
          </p>
        </div>
        <div className="relative flex flex-wrap gap-2.5">
          {["Acessos ao vivo", "Participantes", "Relatórios CSV"].map((t) => (
            <span key={t} className="rounded-full bg-grafite px-4 py-2.5 text-sm">
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="grid min-w-0 flex-[1_1_440px] place-items-center px-2 py-6">
        <form onSubmit={submit} className="flex w-full max-w-[420px] flex-col gap-4" noValidate>
          <span className="self-start rounded-full bg-lima px-3 py-1.5 text-xs font-bold tracking-wide">ACESSO RESTRITO</span>
          <h2 className="font-display text-[44px] font-black leading-none">Entrar</h2>
          <p className="mb-1 text-base text-cinza">Use as credenciais de administrador da RecFace.</p>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Usuário ou e-mail
            <input
              type="text"
              name="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              placeholder="admin@seuevento.com.br"
              className="rf-input"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Senha
            <span className="relative block">
              <input
                type={show ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="rf-input pr-14"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-cinza hover:text-tinta"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {show && <path d="M3 3l18 18" />}
                </svg>
              </button>
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-2xl bg-negado px-4 py-3 text-sm font-medium text-white">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1.5 rounded-full bg-tinta p-[18px] text-base font-bold text-lima transition-opacity disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar no painel"}
          </button>
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <Link to="/plataforma" className="font-semibold text-scan hover:underline">
              ← Voltar para a portaria
            </Link>
            <span className="text-cinza">Sessão expira em 8 horas</span>
          </div>
        </form>
      </section>
    </div>
  );
}
