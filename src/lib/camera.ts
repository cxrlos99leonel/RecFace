/** Abre a webcam, tentando 720p e caindo para a resolução padrão se não suportar. */
export async function openCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("getUserMedia indisponível", "NotSupportedError");
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "OverconstrainedError") {
      return navigator.mediaDevices.getUserMedia({ video: true });
    }
    throw e;
  }
}

/** Traduz o erro da câmera para uma mensagem que diz ao usuário o que fazer. */
export function cameraErrorMessage(e: unknown): string {
  const name = e instanceof DOMException || e instanceof Error ? e.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Permissão da câmera negada. Clique no ícone de câmera/cadeado na barra de endereço e permita o acesso.";
    case "NotReadableError":
    case "AbortError":
      return "A câmera está em uso por outro programa (Teams, Zoom, Meet, OBS…). Feche-o e tente novamente.";
    case "NotFoundError":
      return "Nenhuma câmera foi encontrada neste dispositivo.";
    case "NotSupportedError":
      return "Este navegador não permite acesso à câmera. Use o Chrome ou Edge atualizado, em HTTPS.";
    default:
      return "Não foi possível acessar a câmera.";
  }
}
