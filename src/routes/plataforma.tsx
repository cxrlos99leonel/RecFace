import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Logo, ScanFrame } from "@/components/brand";
import { api, type RecognizeResponse } from "@/lib/api";
import { openCamera, cameraErrorMessage } from "@/lib/camera";
import { useFullscreen, useWakeLock } from "@/lib/kiosk";

type Mode = "reconhecer" | "cadastro";

export const Route = createFileRoute("/plataforma")({
  validateSearch: (search: Record<string, unknown>): { modo?: Mode } =>
    search.modo === "cadastro" ? { modo: "cadastro" } : {},
  head: () => ({
    meta: [
      { title: "Portaria | RecFace" },
      { name: "description", content: "Reconheça o seu rosto para entrar ou faça o seu cadastro." },
    ],
  }),
  component: PlatformPage,
});

const SCAN_EVERY_MS = 900;
const TOTAL_PHOTOS = 5;

type Result =
  | { kind: "autorizado"; title: string; text: string }
  | { kind: "duplicado"; title: string; text: string }
  | { kind: "negado"; title: string; text: string }
  | { kind: "erro"; title: string; text: string };

const RESULT_HOLD_MS: Record<Result["kind"], number> = {
  autorizado: 4000,
  duplicado: 5000,
  negado: 5000,
  erro: 4000,
};

interface Photo {
  preview: string;
  descriptor: number[];
}

function PlatformPage() {
  const modo: Mode = Route.useSearch().modo ?? "reconhecer";
  const navigate = useNavigate({ from: "/plataforma" });
  const setMode = useCallback(
    (m: Mode) => navigate({ search: m === "cadastro" ? { modo: m } : {}, replace: true }),
    [navigate]
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [models, setModels] = useState<"loading" | "ready" | "error">("loading");
  const [cam, setCam] = useState<"off" | "starting" | "on">("off");
  const fullscreen = useFullscreen();
  // Portaria em uso: impede que a tela apague sozinha.
  useWakeLock(cam === "on");

  // ---- Carrega os modelos uma vez ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { loadModels } = await import("@/lib/face-recognition");
        await loadModels();
        if (!cancelled) setModels("ready");
      } catch (e) {
        console.error("Falha ao carregar modelos:", e);
        if (!cancelled) setModels("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    setCam("starting");
    try {
      const stream = await openCamera();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCam("on");
    } catch (e) {
      console.error("Erro ao abrir câmera:", e);
      setCam("off");
      toast.error(cameraErrorMessage(e), { duration: 8000 });
    }
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCam("off");
  }

  // Liga sozinha se o navegador já tiver dado permissão antes (modo quiosque).
  useEffect(() => {
    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((p) => {
        if (p.state === "granted") startCamera();
      })
      .catch(() => {});
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [startCamera]);

  // ---------------- Reconhecimento ----------------
  const [result, setResult] = useState<Result | null>(null);
  const [faceSeen, setFaceSeen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [recent, setRecent] = useState<{ name: string; time: string; key: number }[]>([]);
  const busyRef = useRef(false);
  const resultRef = useRef<Result | null>(null);
  resultRef.current = result;

  const showResult = useCallback((r: Result) => {
    setResult(r);
    window.setTimeout(() => setResult((cur) => (cur === r ? null : cur)), RESULT_HOLD_MS[r.kind]);
  }, []);

  useEffect(() => {
    if (modo !== "reconhecer" || cam !== "on" || models !== "ready") return;
    let stopped = false;
    let timer: number | undefined;

    async function tick() {
      if (stopped) return;
      const video = videoRef.current;
      if (!busyRef.current && !resultRef.current && video && video.readyState >= 2) {
        busyRef.current = true;
        try {
          const { detectDescriptor } = await import("@/lib/face-recognition");
          const desc = await detectDescriptor(video);
          if (stopped) return;
          setFaceSeen(!!desc);
          if (desc) {
            setChecking(true);
            const res: RecognizeResponse = await api.recognize(Array.from(desc));
            if (stopped) return;
            if (res.result === "autorizado") {
              showResult({ kind: "autorizado", title: "Acesso liberado", text: `Bem-vindo(a), ${res.name}! Entrada registrada às ${res.time}.` });
              setRecent((prev) => [{ name: res.name, time: res.time, key: Date.now() }, ...prev].slice(0, 4));
            } else if (res.result === "duplicado") {
              showResult({
                kind: "duplicado",
                title: "Já entrou hoje",
                text: res.first_time
                  ? `${res.name}, sua entrada já foi registrada às ${res.first_time}. Se precisar, fale com a equipe.`
                  : `${res.name}, sua entrada já foi registrada hoje. Se precisar, fale com a equipe.`,
              });
            } else {
              showResult({
                kind: "negado",
                title: "Acesso negado",
                text: "Rosto não inscrito. Procure a equipe da entrada para a liberação manual ou faça seu cadastro agora.",
              });
            }
          }
        } catch (e) {
          console.error(e);
          if (!stopped) {
            showResult({
              kind: "erro",
              title: "Tente de novo",
              text: e instanceof Error ? e.message : "Não foi possível validar agora.",
            });
          }
        } finally {
          busyRef.current = false;
          if (!stopped) setChecking(false);
        }
      }
      timer = window.setTimeout(tick, SCAN_EVERY_MS);
    }
    tick();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [modo, cam, models, showResult]);

  // ---------------- Cadastro ----------------
  const [name, setName] = useState("");
  const [doc, setDoc] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [taking, setTaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enrolled, setEnrolled] = useState<string | null>(null);

  async function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || photos.length >= TOTAL_PHOTOS) return;
    setTaking(true);
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const { detectDescriptor } = await import("@/lib/face-recognition");
      const desc = await detectDescriptor(canvas);
      if (!desc) {
        toast.error("Nenhum rosto encontrado nesta foto. Olhe para a câmera, com boa luz, e tente de novo.");
        return;
      }
      // Miniatura pequena só para conferência na tela; não é enviada nem guardada.
      const thumb = document.createElement("canvas");
      const size = 120;
      const side = Math.min(canvas.width, canvas.height);
      thumb.width = size;
      thumb.height = size;
      thumb.getContext("2d")?.drawImage(canvas, (canvas.width - side) / 2, (canvas.height - side) / 2, side, side, 0, 0, size, size);
      const preview = thumb.toDataURL("image/jpeg", 0.7);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setPhotos((p) => (p.length >= TOTAL_PHOTOS ? p : [...p, { preview, descriptor: Array.from(desc) }]));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao processar a foto. Tente novamente.");
    } finally {
      setTaking(false);
    }
  }

  function resetEnroll() {
    setName("");
    setDoc("");
    setEmail("");
    setConsent(false);
    setPhotos([]);
  }

  async function submitEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 3) return toast.error("Informe o seu nome completo.");
    if (doc.trim().length < 3) return toast.error("Informe um documento (CPF ou RG).");
    if (photos.length < TOTAL_PHOTOS) return toast.error(`Capture as ${TOTAL_PHOTOS} fotos do rosto antes de concluir.`);
    if (!consent) return toast.error("É preciso aceitar o termo de uso da imagem.");
    setSubmitting(true);
    try {
      const avg = Array.from({ length: 128 }, (_, i) => photos.reduce((s, p) => s + p.descriptor[i], 0) / photos.length);
      const res = await api.enroll({ name: name.trim(), document: doc.trim(), email: email.trim(), consent, face_descriptor: avg });
      setEnrolled(res.message);
      resetEnroll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir o cadastro.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------- Textos e cores da tela ----------------
  const isRec = modo === "reconhecer";
  // Azul scan = câmera lendo; lima = liberado; vermelho = negado; âmbar = atenção.
  const frameColor =
    cam !== "on"
      ? "#5B6475"
      : !isRec
        ? "#2F5BFF"
        : result?.kind === "autorizado"
          ? "#C6F432"
          : result?.kind === "negado"
            ? "#D62839"
            : result?.kind === "duplicado"
              ? "#FFB020"
              : "#2F5BFF";

  let hint = "";
  if (models === "loading") hint = "Preparando o reconhecimento facial…";
  else if (models === "error") hint = "Falha ao carregar o reconhecimento facial";
  else if (cam !== "on") hint = "Câmera desligada";
  else if (isRec) hint = result ? result.title : checking ? "Verificando…" : faceSeen ? "Rosto encontrado" : "Procurando rosto…";
  else hint = taking ? "Conferindo a foto…" : photos.length >= TOTAL_PHOTOS ? "Fotos prontas!" : "Centralize o rosto e capture";

  return (
    <div className="min-h-screen bg-tinta px-4 pb-10 pt-5 text-nevoa sm:px-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Barra superior */}
      <header className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Logo inverted />
          <span className="inline-flex items-center gap-2 rounded-full bg-grafite px-3.5 py-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${cam === "on" ? "bg-lima" : "bg-cinza"}`} />
            {cam === "on" ? "Portaria ativa" : "Portaria em espera"}
          </span>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Plataforma">
          {fullscreen.supported && (
            <button
              type="button"
              onClick={fullscreen.toggle}
              className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-[15px] font-medium transition-colors hover:text-lima"
              aria-pressed={fullscreen.isFull}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {fullscreen.isFull ? (
                  <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
                ) : (
                  <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                )}
              </svg>
              {fullscreen.isFull ? "Sair da tela cheia" : "Tela cheia"}
            </button>
          )}
          <Link to="/" className="rounded-full px-4 py-3 text-[15px] font-medium hover:text-lima">
            Voltar ao site
          </Link>
          <Link to="/admin" className="inline-flex items-center gap-2 rounded-full bg-grafite px-4 py-3 text-[15px] font-semibold hover:text-lima">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Área do administrador
          </Link>
        </nav>
      </header>

      {/* Título e seletor de modo */}
      <div className="mx-auto mb-7 mt-10 flex max-w-[1320px] flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[clamp(40px,5vw,64px)] font-black leading-[0.95]">
            {isRec ? "Olhe para a câmera" : "Cadastre seu rosto"}
          </h1>
          <p className="mt-2.5 text-[17px] text-[#C5CAD6]">
            {isRec
              ? "Reconhecemos você em segundos e liberamos a sua entrada."
              : "Leva menos de um minuto. Tiramos 5 fotos para garantir a precisão."}
          </p>
        </div>
        <div role="tablist" aria-label="O que você quer fazer?" className="flex w-full gap-1.5 rounded-full bg-grafite p-1.5 sm:w-auto">
          <ModeTab active={isRec} onClick={() => setMode("reconhecer")} label="Reconhecer rosto">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <circle cx="12" cy="11" r="3" />
          </ModeTab>
          <ModeTab active={!isRec} onClick={() => setMode("cadastro")} label="Fazer cadastro">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
          </ModeTab>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1320px] flex-wrap items-stretch gap-5">
        {/* Câmera */}
        <div className="relative min-h-[420px] min-w-0 flex-[3_1_560px] overflow-hidden rounded-[32px] bg-[#070A14] sm:min-h-[560px]">
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity ${cam === "on" ? "opacity-100" : "opacity-0"}`}
            muted
            playsInline
            aria-label="Imagem da câmera"
          />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative h-[72%] max-h-[420px] w-auto aspect-[200/240]">
              <div key={frameColor} className="rf-lock h-full w-full">
                <ScanFrame color={frameColor} />
              </div>
              {isRec && cam === "on" && !result && (
                <span className="rf-scanline absolute inset-x-[10%] top-1/2 h-[3px] rounded-full bg-scan/80 shadow-[0_0_18px_3px_rgba(47,91,255,.55)]" />
              )}
            </div>
          </div>

          {cam !== "on" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="flex max-w-sm flex-col items-center gap-4">
                {models === "error" ? (
                  <>
                    <p className="text-lg">Não foi possível carregar o reconhecimento facial.</p>
                    <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-lima px-6 py-3.5 font-bold text-tinta">
                      Recarregar a página
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={cam === "starting"}
                      className="inline-flex items-center gap-2.5 rounded-full bg-lima px-7 py-4 text-[17px] font-bold text-tinta transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                      {cam === "starting" ? "Abrindo câmera…" : "Ligar câmera"}
                    </button>
                    <p className="text-sm text-[#9AA3B5]">Permita o acesso à câmera quando o navegador pedir.</p>
                  </>
                )}
              </div>
            </div>
          )}

          {cam === "on" && (
            <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-tinta/75 px-3.5 py-2 text-[13px] font-semibold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#D62839]" /> Câmera ligada
            </span>
          )}
          {cam === "on" && (
            <button
              type="button"
              onClick={stopCamera}
              className="absolute right-5 top-5 rounded-full bg-tinta/75 px-3.5 py-2 text-[13px] font-semibold hover:text-lima"
            >
              Desligar
            </button>
          )}
          <span
            className="absolute bottom-6 left-1/2 max-w-[90%] -translate-x-1/2 truncate rounded-full bg-tinta/80 px-5 py-3 text-[15px] font-medium"
            aria-live="polite"
          >
            {hint}
          </span>
        </div>

        {/* Painel lateral */}
        <div className="flex min-w-0 flex-[2_1_380px] flex-col gap-4">
          {isRec ? (
            <>
              <ResultCard key={result?.kind ?? "aguardando"} result={result} onEnroll={() => setMode("cadastro")} />
              <div className="flex flex-col gap-3.5 rounded-[28px] bg-grafite p-6">
                <strong className="text-base">Para um reconhecimento rápido</strong>
                {["Olhe de frente para a câmera", "Retire óculos escuros, boné ou máscara", "Aguarde a tela confirmar sua entrada"].map((t, i) => (
                  <div key={t} className="flex items-center gap-3 text-[15px] text-[#C5CAD6]">
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-grafite-2 text-[13px] font-bold text-lima">{i + 1}</span>
                    {t}
                  </div>
                ))}
              </div>
              <div className="flex flex-1 flex-col gap-1 rounded-[28px] bg-grafite p-6">
                <div className="mb-2 flex items-center justify-between">
                  <strong className="text-base">Últimas entradas</strong>
                  <span className="text-[13px] text-[#9AA3B5]">neste terminal</span>
                </div>
                {recent.length === 0 ? (
                  <p className="text-[15px] text-[#9AA3B5]">Nenhuma entrada ainda.</p>
                ) : (
                  recent.map((r) => (
                    <div key={r.key} className="flex justify-between border-t border-grafite-2 py-2.5 text-[15px]">
                      <span>{r.name}</span>
                      <span className="text-lima">{r.time}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : enrolled ? (
            <div className="flex flex-1 flex-col justify-center gap-5 rounded-[28px] bg-lima p-8 text-tinta">
              <span className="grid h-14 w-14 place-items-center rounded-[18px] bg-tinta text-lima">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <div>
                <h2 className="font-display text-[34px] font-black leading-none">Cadastro feito!</h2>
                <p className="mt-2.5 text-[17px] leading-snug">{enrolled}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button type="button" onClick={() => { setEnrolled(null); setMode("reconhecer"); }} className="rounded-full bg-tinta px-5 py-3.5 font-semibold text-lima">
                  Reconhecer agora
                </button>
                <button type="button" onClick={() => setEnrolled(null)} className="rounded-full bg-white px-5 py-3.5 font-semibold">
                  Novo cadastro
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3.5 rounded-[28px] bg-grafite p-6">
                <div className="flex items-center justify-between">
                  <strong className="text-base">Fotos do rosto</strong>
                  <span className="text-sm font-semibold text-lima">
                    {photos.length} de {TOTAL_PHOTOS}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: TOTAL_PHOTOS }).map((_, i) =>
                    photos[i] ? (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                        className="group relative aspect-square overflow-hidden rounded-xl"
                        aria-label={`Refazer foto ${i + 1}`}
                        title="Refazer esta foto"
                      >
                        <img src={photos[i].preview} alt="" className="h-full w-full -scale-x-100 object-cover" />
                        <span className="absolute inset-0 grid place-items-center bg-tinta/60 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                          Refazer
                        </span>
                      </button>
                    ) : (
                      <span
                        key={i}
                        className={`aspect-square rounded-xl border-2 border-dashed ${i === photos.length ? "border-lima" : "border-grafite-2"}`}
                      />
                    )
                  )}
                </div>
                <button
                  type="button"
                  onClick={cam === "on" ? takePhoto : startCamera}
                  disabled={models !== "ready" || taking || photos.length >= TOTAL_PHOTOS || cam === "starting"}
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-lima p-4 text-base font-bold text-tinta disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  {models !== "ready"
                    ? "Preparando…"
                    : cam !== "on"
                      ? "Ligar câmera"
                      : taking
                        ? "Conferindo rosto…"
                        : photos.length >= TOTAL_PHOTOS
                          ? "Fotos completas"
                          : `Capturar foto ${photos.length + 1}`}
                </button>
                <p className="text-[13px] text-[#9AA3B5]">Vire levemente o rosto entre uma foto e outra. Toque numa foto para refazer.</p>
              </div>

              <form onSubmit={submitEnroll} className="flex flex-col gap-3.5 rounded-[28px] bg-nevoa p-6 text-tinta">
                <Field label="Nome completo">
                  <input value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={80} autoComplete="name" placeholder="Como está no documento" className="rf-input" />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <Field label="Documento (CPF ou RG)" className="flex-[1_1_160px]">
                    <input value={doc} onChange={(e) => setDoc(e.target.value)} required minLength={3} maxLength={30} placeholder="000.000.000-00" className="rf-input" />
                  </Field>
                  <Field label="E-mail (opcional)" className="flex-[1_1_160px]">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="voce@email.com" className="rf-input" />
                  </Field>
                </div>
                <label className="flex items-start gap-3 rounded-[14px] bg-white p-3.5 text-sm leading-snug">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-tinta" />
                  Autorizo o uso do meu rosto para controle de acesso, conforme a LGPD. Nenhuma foto é armazenada, só um vetor numérico.
                </label>
                <button type="submit" disabled={submitting} className="rounded-full bg-tinta p-4 text-base font-bold text-lima disabled:opacity-60">
                  {submitting ? "Salvando…" : "Concluir cadastro"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeTab({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-3.5 text-[15px] font-semibold transition-colors sm:flex-none sm:px-5 ${
        active ? "bg-lima text-tinta" : "text-nevoa hover:text-lima"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
      {label}
    </button>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-semibold ${className}`}>
      {label}
      {children}
    </label>
  );
}

function ResultCard({ result, onEnroll }: { result: Result | null; onEnroll: () => void }) {
  const kind = result?.kind ?? "aguardando";
  const styles: Record<string, string> = {
    aguardando: "bg-nevoa text-tinta ring-[3px] ring-inset ring-scan",
    autorizado: "bg-lima text-tinta",
    duplicado: "bg-ambar text-tinta",
    negado: "bg-negado text-white",
    erro: "bg-grafite-2 text-nevoa",
  };
  const iconBg: Record<string, string> = {
    aguardando: "bg-scan text-white",
    autorizado: "bg-tinta text-lima",
    duplicado: "bg-tinta text-ambar",
    negado: "bg-black/25 text-white",
    erro: "bg-grafite text-lima",
  };
  return (
    <div className={`rf-pop flex flex-col gap-4 rounded-[28px] p-7 transition-colors ${styles[kind]}`} role="status" aria-live="assertive">
      <span className={`grid h-14 w-14 place-items-center rounded-[18px] ${iconBg[kind]} ${kind === "autorizado" ? "rf-ring" : ""}`}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={kind === "aguardando" ? 2.4 : 3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={kind === "autorizado" || kind === "negado" ? "rf-draw" : undefined}>
          {kind === "autorizado" && <path d="M20 6 9 17l-5-5" pathLength={1} />}
          {kind === "negado" && <path d="M18 6 6 18M6 6l12 12" pathLength={1} />}
          {kind === "duplicado" && <><path d="M12 9v4" /><path d="M12 17h.01" /><circle cx="12" cy="12" r="10" /></>}
          {(kind === "aguardando" || kind === "erro") && <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
        </svg>
      </span>
      <div>
        <div className="font-display text-[34px] font-black leading-none">{result?.title ?? "Escaneando…"}</div>
        <p className="mt-2.5 text-[17px] leading-snug">{result?.text ?? "Posicione o rosto dentro da moldura."}</p>
      </div>
      {kind === "negado" && (
        <button type="button" onClick={onEnroll} className="self-start rounded-full bg-white px-4.5 py-3 px-5 text-[15px] font-semibold text-tinta">
          Fazer meu cadastro
        </button>
      )}
    </div>
  );
}
