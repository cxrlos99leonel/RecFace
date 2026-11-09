import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, FaceScanArt, Logo } from "@/components/brand";
import { useScrollReveal } from "@/lib/reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RecFace | Olhe. Entre. Curta." },
      {
        name: "description",
        content:
          "Controle de acesso por reconhecimento facial para festas, shows, cinemas e empresas. Sem fila, sem ingresso, com privacidade.",
      },
    ],
  }),
  component: LandingPage,
});

const CHECK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function LandingPage() {
  useScrollReveal();
  return (
    <div className="overflow-hidden bg-nevoa text-tinta">
      <Hero />
      <Stats />
      <HowItWorks />
      <Problems />
      <Solutions />
      <Segments />
      <Plans />
      <Privacy />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative bg-tinta px-4 pb-24 pt-5 text-nevoa sm:px-6">
      <svg aria-hidden="true" viewBox="0 0 1440 900" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
        <polygon points="760,0 1440,0 1440,520 1180,900 620,900 930,420 700,470" fill="#1C2333" />
        <polygon points="1180,900 1440,520 1440,600 1250,900" fill="#C6F432" />
      </svg>

      <Navbar />

      <div className="relative mx-auto mt-14 flex max-w-[1240px] flex-wrap items-center gap-14 sm:mt-20">
        <div className="min-w-0 flex-[1_1_520px]">
          <div className="rf-rise mb-7 inline-flex flex-wrap items-center gap-3 text-nevoa">
            <span className="rounded-full bg-lima px-3.5 py-2 text-[13px] font-bold tracking-wide text-tinta">NOVO</span>
            <span className="text-base font-medium">Entrada por reconhecimento facial</span>
          </div>
          <h1 className="rf-rise rf-rise-2 font-display text-[clamp(64px,10vw,152px)] font-bold leading-[0.95]">
            Olhe.
            <br />
            <span className="rounded-xl bg-lima px-[0.12em] italic text-tinta">Entre.</span>
            <br />
            Curta.
          </h1>
          <p className="rf-rise rf-rise-3 mt-8 max-w-[520px] text-lg leading-relaxed text-[#C5CAD6] sm:text-xl">
            Sem fila e sem ingresso no celular. A RecFace reconhece o rosto do participante na porta e libera a
            entrada em segundos. Funciona em festas, shows, cinemas e empresas.
          </p>
          <div className="rf-rise rf-rise-4 mt-9 flex flex-wrap gap-3">
            <Link
              to="/plataforma"
              className="group inline-flex items-center gap-2.5 rounded-full bg-lima px-6 py-4 text-[17px] font-semibold text-tinta transition-transform hover:-translate-y-0.5"
            >
              Acessar plataforma <ArrowRight />
            </Link>
            <a
              href="#como"
              className="inline-flex items-center gap-2.5 rounded-full px-6 py-4 text-[17px] font-semibold text-nevoa ring-[1.5px] ring-inset ring-[#3A4560] transition-colors hover:ring-nevoa"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="m10 8 6 4-6 4z" />
              </svg>
              Ver como funciona
            </a>
          </div>
        </div>

        <div className="rf-rise rf-rise-3 relative flex min-w-0 flex-[1_1_440px] justify-center py-10">
          <div className="w-full max-w-[440px] rotate-[3deg] rounded-[40px] bg-grafite p-3.5 shadow-[0_40px_80px_-30px_rgba(11,16,32,.55)]">
            <div className="flex flex-col gap-4 rounded-[28px] bg-tinta p-5">
              <div className="flex items-center justify-between text-[13px] text-nevoa">
                <span className="font-semibold">Portaria · Entrada principal</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-lima" /> Ao vivo
                </span>
              </div>
              <div className="relative grid aspect-[4/4.4] place-items-center overflow-hidden rounded-[20px] bg-[#070A14]">
                <FaceScanArt className="w-[70%]" />
                <span className="rf-scanline pointer-events-none absolute inset-x-6 top-1/2 h-[3px] rounded-full bg-lima/80 shadow-[0_0_16px_3px_rgba(198,244,50,.4)]" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-lima px-4 py-3.5 text-tinta">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-tinta text-lima">{CHECK}</span>
                <span className="flex flex-col">
                  <strong className="text-[15px]">Acesso liberado</strong>
                  <span className="text-[13px]">Bem-vinda, Ana · 21:42</span>
                </span>
              </div>
            </div>
          </div>
          <div className="rf-float absolute left-0 top-[18%] flex -rotate-[4deg] flex-col gap-1 rounded-[18px] bg-white px-4 py-3.5 text-tinta shadow-[0_20px_40px_-20px_rgba(11,16,32,.4)]">
            <span className="text-xs text-cinza">Validação</span>
            <strong className="font-display text-[26px] font-extrabold">em segundos</strong>
          </div>
          <div className="rf-float rf-float-2 absolute bottom-[6%] right-0 flex items-center gap-2.5 rounded-full bg-white py-2.5 pl-2.5 pr-4 text-[13px] font-semibold text-tinta shadow-[0_20px_40px_-20px_rgba(11,16,32,.4)]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-tinta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C6F432" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            Nenhuma foto armazenada
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    ["128", "números formam a assinatura facial de cada participante"],
    ["0", "fotos guardadas: só o vetor numérico fica salvo"],
    ["1", "câmera basta: notebook ou celular, direto no navegador"],
  ];
  return (
    <section className="bg-white px-6 py-16 sm:py-[72px]">
      <div className="mx-auto grid max-w-[1240px] gap-10 text-center sm:grid-cols-3">
        {items.map(([n, t]) => (
          <div key={n} data-reveal>
            <div className="font-display text-[clamp(56px,7vw,104px)] font-black leading-none">{n}</div>
            <p className="mx-auto mt-2.5 max-w-[260px] text-base text-[#3D4556]">{t}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarqueeRow({ words, offset = false }: { words: string[]; offset?: boolean }) {
  const row = [...words, ...words];
  return (
    <div className={`overflow-hidden ${offset ? "mt-2" : ""}`} aria-hidden="true">
      <div className={`rf-marquee flex w-max gap-8 whitespace-nowrap font-display text-[clamp(48px,7.5vw,120px)] font-black uppercase leading-none ${offset ? "[animation-direction:reverse]" : ""}`}>
        {row.map((w, i) => (
          <span key={i} className={i % 2 === (offset ? 0 : 1) ? "text-lima" : "text-[#222B42]"}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    ["01", "Cadastro", "O participante registra o rosto uma única vez, com consentimento explícito, em poucos cliques."],
    ["02", "Reconhecimento", "Na porta, a câmera identifica o rosto e responde na hora: tela verde para liberado, aviso claro quando não reconhece."],
    ["03", "Acesso registrado", "O administrador acompanha as entradas em tempo real e exporta relatórios do evento."],
  ];
  return (
    <section id="como" className="scroll-mt-6 rounded-t-[40px] bg-tinta pb-24 pt-16 text-nevoa">
      <p className="sr-only">Para eventos, shows, cinemas, empresas e festas. Sem fila, sem ingresso, sem fraude, sem papel.</p>
      <MarqueeRow words={["Eventos", "Shows", "Cinemas", "Empresas", "Festas"]} />
      <MarqueeRow words={["Sem fila", "Sem ingresso", "Sem fraude", "Sem papel"]} offset />

      <div className="mx-auto mt-[72px] grid max-w-[1240px] gap-5 px-4 sm:px-6 md:grid-cols-3">
        <article data-reveal className="flex min-h-[340px] flex-col justify-between gap-5 rounded-[28px] bg-nevoa p-8 text-tinta sm:p-10 md:col-span-2">
          <span className="self-start rounded-full bg-lima px-3 py-1.5 text-xs font-bold">Como funciona</span>
          <h2 data-reveal className="font-display text-[clamp(40px,4.6vw,64px)] font-black leading-[0.95]">
            Seu rosto é<br />o seu ingresso.
          </h2>
          <p className="max-w-[560px] text-lg leading-relaxed">
            O organizador cadastra os participantes, a câmera reconhece cada um na entrada e todo acesso fica
            registrado com data e horário. Simples para quem entra, transparente para quem organiza.
          </p>
        </article>
        <article data-reveal className="flex min-h-[340px] flex-col justify-between gap-6 rounded-[28px] bg-grafite p-8">
          <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-lima">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0B1020" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <div>
            <div className="font-display text-[44px] font-black leading-none text-lima">Antifraude</div>
            <p className="mt-3 text-base leading-relaxed text-[#C5CAD6]">
              Ingresso pode ser repassado. Rosto, não. Cada pessoa entra uma vez por dia e a tentativa duplicada é
              bloqueada.
            </p>
          </div>
        </article>
        {steps.map(([n, title, text], i) => (
          <article key={n} data-reveal className={`rf-lift flex flex-col gap-4 rounded-[28px] p-8 ${i === 1 ? "bg-lima text-tinta" : "bg-grafite"}`}>
            <span className={`font-display text-[56px] font-black leading-none ${i === 1 ? "" : "text-lima"}`}>{n}</span>
            <h3 className="font-display text-[28px] font-extrabold">{title}</h3>
            <p className={`text-base leading-relaxed ${i === 1 ? "" : "text-[#C5CAD6]"}`}>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Problems() {
  return (
    <section className="px-4 pb-10 pt-28 sm:px-6">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-cinza">Por que RecFace</span>
            <h2 data-reveal className="mt-3 font-display text-[clamp(40px,5.6vw,84px)] font-black leading-[0.95]">
              <span className="bg-lima px-[0.1em]">Chega</span> de fila
              <br />
              na porta.
            </h2>
          </div>
          <p className="max-w-[420px] text-lg leading-relaxed text-[#3D4556]">
            Conferir ingresso um por um é lento, cansa a equipe e abre espaço para fraude. Trocamos tudo isso por um
            olhar para a câmera.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <ProblemCard
            title="Filas e atrasos"
            text="Todos chegam ao mesmo tempo e a conferência manual não acompanha o ritmo."
            icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
          />
          <ProblemCard
            dark
            title="Ingressos repassados"
            text="Ingresso perdido, print compartilhado, QR code duplicado. Com o rosto, só entra quem foi cadastrado."
            icon={<><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" /><path d="m9 9 6 6" /><path d="m15 9-6 6" /></>}
          />
          <ProblemCard
            title="Zero visibilidade"
            text="Sem saber quem entrou e quando, fica difícil organizar o local e prestar contas."
            icon={<><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></>}
          />
        </div>
      </div>
    </section>
  );
}

function ProblemCard({ title, text, icon, dark = false }: { title: string; text: string; icon: ReactNode; dark?: boolean }) {
  return (
    <article data-reveal className={`rf-lift flex flex-col gap-3.5 rounded-[28px] p-8 ${dark ? "bg-tinta text-nevoa" : "bg-white"}`}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dark ? "#C6F432" : "#0B1020"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon}
      </svg>
      <h3 className={`font-display text-[26px] font-extrabold ${dark ? "text-lima" : ""}`}>{title}</h3>
      <p className={`text-base leading-relaxed ${dark ? "text-[#C5CAD6]" : "text-[#3D4556]"}`}>{text}</p>
    </article>
  );
}

const FEATURES = [
  {
    title: "Reconhecimento na portaria",
    text: "Tela de entrada que identifica o rosto e libera na hora.",
    detail: "A câmera procura um rosto a cada segundo. Reconheceu: tela verde com o nome. Não reconheceu: aviso claro e opção de cadastro.",
  },
  {
    title: "Cadastro de participantes",
    text: "Captura guiada do rosto com termo de consentimento.",
    detail: "Cinco fotos conferidas na hora. Cada uma vira um vetor numérico; as fotos são descartadas e nunca saem do navegador.",
  },
  {
    title: "Painel do administrador",
    text: "Acessos ao vivo, participantes e exclusões em um só lugar.",
    detail: "Login exclusivo. Acompanhe entradas liberadas, negadas e duplicadas, libere manualmente e exclua cadastros.",
  },
  {
    title: "Relatórios de acesso",
    text: "Entradas por data e período, com exportação em CSV.",
    detail: "Escolha o período e veja o movimento por dia e a frequência de cada participante. Exporte para o Excel com um clique.",
  },
];

function Solutions() {
  const [active, setActive] = useState(0);
  return (
    <section id="solucoes" className="scroll-mt-6 px-4 py-24 sm:px-6">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-14">
        <div className="min-w-0 flex-[1_1_460px]">
          <h2 data-reveal className="font-display text-[clamp(40px,4.8vw,68px)] font-black leading-[0.95]">
            Tudo que seu
            <br />
            evento <span className="rounded-[10px] bg-tinta px-[0.12em] text-lima">precisa.</span>
          </h2>
          <p className="mb-8 mt-5 max-w-[480px] text-lg leading-relaxed text-[#3D4556]">
            Uma plataforma web com tudo para controlar a entrada, do cadastro do rosto ao relatório final.
          </p>
          <div className="flex flex-col gap-2.5" role="tablist" aria-label="Recursos">
            {FEATURES.map((f, i) => (
              <button
                key={f.title}
                type="button"
                role="tab"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className={`group flex w-full items-center justify-between gap-4 rounded-[20px] px-5 py-5 text-left transition-colors ${
                  active === i ? "bg-tinta text-lima" : "bg-white hover:bg-white/70"
                }`}
              >
                <span className="flex flex-col gap-1">
                  <strong className="text-[17px]">{f.title}</strong>
                  <span className="text-sm opacity-80">{f.text}</span>
                </span>
                <ArrowRight width={20} height={20} />
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-w-0 flex-[1_1_520px] rounded-[36px] bg-lima p-6 sm:p-8">
          <div className="flex flex-col gap-4 rounded-[22px] bg-white p-5 shadow-[0_30px_60px_-30px_rgba(11,16,32,.45)] sm:p-6">
            <div className="flex items-center justify-between">
              <strong className="font-display text-xl font-extrabold">Visão geral</strong>
              <span className="rounded-full bg-nevoa px-2.5 py-1.5 text-xs">Hoje</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-[14px] bg-tinta p-3.5 text-lima"><div className="text-xs text-[#C5CAD6]">Entradas</div><div className="font-display text-[30px] font-black">248</div></div>
              <div className="rounded-[14px] bg-nevoa p-3.5"><div className="text-xs text-cinza">Cadastrados</div><div className="font-display text-[30px] font-black">312</div></div>
              <div className="rounded-[14px] bg-nevoa p-3.5"><div className="text-xs text-cinza">Negados</div><div className="font-display text-[30px] font-black">7</div></div>
            </div>
            <div className="flex h-[120px] items-end gap-2 border-b border-nevoa px-1 py-2" aria-hidden="true">
              {[20, 34, 52, 88, 70, 44, 26].map((h, i) => (
                <span key={i} className={`flex-1 rounded-t-lg rounded-b-sm ${i === 3 ? "bg-tinta" : "bg-nevoa"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between"><span>Ana Souza</span><span className="rounded-full bg-lima px-2.5 py-1 text-xs font-semibold">Autorizado · 21:42</span></div>
              <div className="flex items-center justify-between"><span>Rosto não reconhecido</span><span className="rounded-full bg-tinta px-2.5 py-1 text-xs font-semibold text-nevoa">Negado · 21:40</span></div>
            </div>
          </div>
          <p className="mx-1 mt-5 min-h-[48px] text-[15px] font-medium leading-snug" aria-live="polite">
            {FEATURES[active].detail}
          </p>
          <p className="mx-1 mt-1 text-xs font-semibold">Dados ilustrativos</p>
        </div>
      </div>
    </section>
  );
}

function Segments() {
  const items: [string, string, ReactNode][] = [
    ["Festas e shows", "Plano por evento, com técnico no local.", <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>],
    ["Cinemas", "Entrada ágil nos horários de pico.", <><rect x="2" y="2" width="20" height="20" rx="2.2" /><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" /></>],
    ["Casas de eventos", "Controle centralizado de todo o público.", <><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /></>],
    ["Empresas", "Registro de entrada de equipe e visitantes.", <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>],
  ];
  return (
    <section className="px-4 pb-28 pt-10 sm:px-6">
      <div className="mx-auto max-w-[1240px]">
        <h2 data-reveal className="mb-8 text-center font-display text-[clamp(32px,4vw,56px)] font-black">
          <span className="bg-lima px-[0.12em]">Feito</span> para quem recebe gente
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([t, d, icon]) => (
            <div key={t} data-reveal className="rf-lift flex min-h-[180px] flex-col justify-between rounded-3xl bg-white p-7">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0B1020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
              <div>
                <strong className="font-display text-2xl font-extrabold">{t}</strong>
                <p className="mt-1.5 text-[15px] text-[#3D4556]">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Plans() {
  const plans = [
    {
      name: "Básico",
      who: "Pequenas empresas e estabelecimentos",
      price: "R$ 390",
      unit: "/mês por ponto",
      items: ["1 terminal de reconhecimento", "Até 1.000 pessoas cadastradas", "Registros de entrada e saída", "Suporte remoto em horário comercial"],
    },
    {
      name: "Profissional",
      who: "Cinemas, casas de eventos e empresas maiores",
      price: "R$ 690",
      unit: "/mês por ponto",
      items: ["1 terminal de reconhecimento", "Até 10.000 pessoas", "Visitantes temporários", "Relatórios completos", "Suporte prioritário 7 dias por semana"],
      featured: true,
    },
    {
      name: "Evento",
      who: "Festas, shows e eventos pontuais",
      price: "R$ 1.200",
      unit: "/evento",
      items: ["Até 300 participantes", "R$ 2,50 por participante extra", "2 terminais e instalação", "Técnico no local durante o evento"],
    },
  ];
  return (
    <section id="planos" className="scroll-mt-6 rounded-[40px] bg-white px-4 py-28 sm:px-6">
      <div className="mx-auto max-w-[1240px]">
        <div className="mx-auto max-w-[680px] text-center">
          <span className="rounded-full bg-tinta px-3.5 py-2 text-[13px] font-bold text-lima">Planos</span>
          <h2 data-reveal className="mb-3 mt-5 font-display text-[clamp(40px,5vw,72px)] font-black leading-[0.95]">Escolha o seu plano</h2>
          <p className="text-lg leading-relaxed text-[#3D4556]">
            Terminal emprestado durante o contrato e suporte técnico incluso em todos os planos.
          </p>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((p) => (
            <article key={p.name} data-reveal className={`rf-lift relative flex flex-col gap-5 rounded-[28px] p-8 ${p.featured ? "bg-tinta text-nevoa" : "bg-nevoa"}`}>
              {p.featured && (
                <span className="absolute right-6 top-6 rounded-full bg-lima px-3 py-1.5 text-xs font-bold text-tinta">Mais completo</span>
              )}
              <div>
                <h3 className={`font-display text-[28px] font-extrabold ${p.featured ? "text-lima" : ""}`}>{p.name}</h3>
                <p className={`mt-1.5 text-[15px] ${p.featured ? "text-[#C5CAD6]" : "text-[#3D4556]"}`}>{p.who}</p>
              </div>
              <div>
                <span className="font-display text-[52px] font-black">{p.price}</span>
                <span className={`text-[15px] ${p.featured ? "text-[#C5CAD6]" : "text-[#3D4556]"}`}> {p.unit}</span>
              </div>
              <ul className="flex flex-1 flex-col gap-2.5 text-[15px]">
                {p.items.map((it) => (
                  <li key={it} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 ${p.featured ? "text-lima" : ""}`}>{CHECK}</span>
                    {it}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:contato@recface.com.br?subject=Quero%20contratar%20a%20RecFace"
                className={`rounded-full p-3.5 text-center font-semibold ${p.featured ? "bg-lima text-tinta" : "bg-tinta text-lima"}`}
              >
                Falar com a equipe
              </a>
            </article>
          ))}
        </div>
        <p className="mt-7 text-center text-sm text-cinza">
          Planos mensais: taxa de implantação de R$ 500 por ponto, contrato mínimo de 12 meses e 10% de desconto no
          pagamento anual.
        </p>
      </div>
    </section>
  );
}

function Privacy() {
  const items: [string, string, ReactNode][] = [
    ["Consentimento obrigatório", "Nenhum cadastro acontece sem o aceite do termo de uso da imagem.", <path d="M20 6 9 17l-5-5" />],
    ["Sem fotos guardadas", "A imagem é analisada no navegador e descartada. Só fica um vetor de 128 números.", <><path d="M2 2l20 20" /><path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16" /><path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5" /><path d="M14.12 15.12A3 3 0 1 1 9.88 10.88" /></>],
    ["Acesso restrito", "Listas, relatórios e exclusões ficam atrás do login do administrador.", <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>],
  ];
  return (
    <section id="privacidade" className="scroll-mt-6 px-4 py-28 sm:px-6">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-12 rounded-[40px] bg-tinta p-[clamp(28px,6vw,72px)] text-nevoa">
        <div className="min-w-0 flex-[1_1_420px]">
          <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-lima">Privacidade e LGPD</span>
          <h2 data-reveal className="mb-5 mt-4 font-display text-[clamp(40px,5.6vw,84px)] font-black leading-[0.95]">
            Seu rosto,
            <br />
            <span className="text-lima">suas regras.</span>
          </h2>
          <p className="max-w-[480px] text-lg leading-relaxed text-[#C5CAD6]">
            Dados biométricos são dados sensíveis pela LGPD. Por isso a RecFace foi desenhada para guardar o mínimo
            possível, e só com a sua autorização.
          </p>
        </div>
        <div className="grid min-w-0 flex-[1_1_420px] gap-3.5">
          {items.map(([t, d, icon]) => (
            <div key={t} data-reveal className="rf-lift flex items-start gap-4 rounded-[20px] bg-grafite p-5">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-lima">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B1020" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
              </span>
              <div>
                <strong className="text-[17px]">{t}</strong>
                <p className="mt-1 text-[15px] text-[#C5CAD6]">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  ["Preciso comprar algum equipamento?", "Não. A plataforma funciona no navegador com a câmera de um notebook ou celular. Nos planos contratados, o terminal facial é emprestado durante o contrato."],
  ["As fotos dos participantes ficam salvas?", "Não. A foto é analisada no próprio navegador e descartada; só um vetor de 128 números, que não permite reconstruir a imagem, é enviado e guardado."],
  ["E se o rosto não for reconhecido?", "A tela avisa na hora e orienta a pessoa a procurar a equipe da entrada ou fazer o cadastro. O administrador pode liberar a entrada manualmente pelo painel."],
  ["Quem pode ver a lista de participantes?", "Apenas quem entra com o login de administrador. Cadastro e reconhecimento ficam abertos na portaria; o restante é protegido."],
  ["Quanto custa?", "A partir de R$ 390 por mês por ponto de acesso, ou R$ 1.200 por evento de até 300 pessoas. Veja os detalhes na seção de planos."],
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-6 px-4 pb-28 sm:px-6">
      <div className="mx-auto flex max-w-[1240px] flex-wrap gap-12">
        <div className="min-w-0 flex-[1_1_320px]">
          <h2 data-reveal className="font-display text-[clamp(40px,5.6vw,84px)] font-black leading-[0.95]">
            Dúvidas
            <br />
            frequentes
          </h2>
          <p className="mt-4 max-w-[360px] text-[17px] text-[#3D4556]">
            Não achou o que procurava?{" "}
            <a href="mailto:contato@recface.com.br" className="font-semibold text-scan underline">
              Fale com a nossa equipe.
            </a>
          </p>
        </div>
        <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-3">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q} data-reveal className="overflow-hidden rounded-[20px] bg-white">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[17px] font-semibold"
                  >
                    {q}
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-nevoa text-xl" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <p id={`faq-${i}`} className="px-6 pb-5 text-base leading-relaxed text-[#3D4556]">
                    {a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="contato" className="px-4 sm:px-6">
      <div data-reveal className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-8 rounded-[40px] bg-lima p-[clamp(32px,7vw,88px)]">
        <h2 data-reveal className="font-display text-[clamp(40px,5.6vw,84px)] font-black leading-[0.95]">
          Pronto para
          <br />
          acabar com a fila?
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/plataforma" className="rounded-full bg-tinta px-7 py-[18px] text-[17px] font-semibold text-lima transition-transform hover:-translate-y-0.5">
            Acessar plataforma
          </Link>
          <a href="mailto:contato@recface.com.br" className="rounded-full bg-white px-7 py-[18px] text-[17px] font-semibold transition-transform hover:-translate-y-0.5">
            Falar com vendas
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-10 bg-tinta px-4 pb-10 pt-14 text-nevoa sm:px-6">
      <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-10">
        <div className="max-w-[340px]">
          <Logo inverted />
          <p className="mt-3 text-[15px] leading-relaxed text-[#C5CAD6]">Tecnologia para conectar pessoas a novas experiências.</p>
        </div>
        <div className="flex flex-wrap gap-14 text-[15px]">
          <div className="flex flex-col gap-2.5">
            <strong>Produto</strong>
            <a href="#como" className="text-[#C5CAD6] hover:text-lima">Como funciona</a>
            <a href="#planos" className="text-[#C5CAD6] hover:text-lima">Planos</a>
            <Link to="/plataforma" className="text-[#C5CAD6] hover:text-lima">Plataforma</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <strong>Empresa</strong>
            <a href="#privacidade" className="text-[#C5CAD6] hover:text-lima">Privacidade</a>
            <a href="#faq" className="text-[#C5CAD6] hover:text-lima">Dúvidas</a>
            <Link to="/login" className="text-[#C5CAD6] hover:text-lima">Área do administrador</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1240px] flex-wrap justify-between gap-3 border-t border-grafite-2 pt-6 text-[13px] text-[#9AA3B5]">
        <span>© 2026 RecFace</span>
        <span>Projeto acadêmico · Ciência da Computação · PUC Minas</span>
      </div>
    </footer>
  );
}
