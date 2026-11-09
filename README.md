# RecFace

Controle de acesso por **reconhecimento facial** para eventos, cinemas e empresas.
Projeto do TAI 3 (PUC Minas).

**No ar:** https://presenca-facial-one.vercel.app

| Página | Endereço |
|---|---|
| Site institucional | `/` |
| Portaria (reconhecer rosto / fazer cadastro) | `/plataforma` |
| Login do administrador | `/login` |
| Painel (acessos, participantes, relatórios) | `/admin` |

## Como funciona

1. **Cadastro:** o participante tira 5 fotos na portaria e aceita o termo (LGPD). O navegador transforma o
   rosto em 128 números; as fotos são descartadas e nunca saem do aparelho.
2. **Portaria:** a câmera procura um rosto a cada segundo e envia só o vetor ao servidor, que decide
   **liberado**, **negado** ou **já entrou hoje**.
3. **Painel:** o administrador acompanha as entradas, libera manualmente, exclui cadastros e exporta CSV.

## Stack

React 19 · TanStack Start · Tailwind CSS 4 · shadcn/ui · face-api (TensorFlow.js) em Web Worker ·
Nitro · Upstash Redis · Vercel · Playwright + axe

## Rodando localmente

```bash
bun install
bun run dev
bun run build && bun run test:e2e
```

Sem variáveis de ambiente, os dados ficam em memória e o login de teste é `admin@recface.local` / `recface123`.
Em produção: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

Detalhes de arquitetura, regras e histórico em [`CONTEXTO-DO-PROJETO.md`](CONTEXTO-DO-PROJETO.md).
