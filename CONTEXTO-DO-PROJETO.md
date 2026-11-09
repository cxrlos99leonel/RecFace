# RecFace: Contexto Geral do Projeto

Controle de acesso por reconhecimento facial para eventos, festas, cinemas e empresas.
Trabalho Acadêmico Integrado III (TAI 3), Ciência da Computação, PUC Minas.

**Site publicado:** https://presenca-facial-one.vercel.app

> Esta é a versão 2 do sistema. A versão 1 (TAI 2) controlava presença de alunos em laboratórios;
> a versão 2 adapta o mesmo motor de reconhecimento à proposta da empresa RecFace.

---

## 1. Equipe

**Integrantes**
- Carlos Eduardo Divino Souza Leonel
- Henrique Rodrigues Martins
- João Vitor Garçon dos Reis
- Jonas Henrique Teixeira
- Luis Augusto de Oliveira Bordin

**Orientadores**
- Diego Roberto Gonçalves de Pontes
- Udo Fritzke Junior
- Will Ricardo dos Santos Machado

---

## 2. O que o sistema faz

O participante se cadastra uma única vez (nome, documento, 5 fotos do rosto e aceite do termo da LGPD).
Na entrada, olha para a câmera: o sistema reconhece o rosto, libera o acesso e registra data e horário.
O administrador faz login para acompanhar os acessos, gerenciar participantes, liberar entradas
manualmente e gerar relatórios.

---

## 3. Telas

| Tela | Endereço | Quem usa | Função |
|---|---|---|---|
| Site | `/` | Público | Página institucional: proposta, como funciona, planos, privacidade (LGPD), dúvidas |
| Portaria | `/plataforma` | Participante / equipe da entrada | Duas opções: **Reconhecer rosto** e **Fazer cadastro** (`/plataforma?modo=cadastro`) |
| Login | `/login` | Administrador | E-mail e senha; sessão de 8 horas |
| Visão geral | `/admin` | Administrador | Entradas do dia (ao vivo, a cada 10 s), gráfico por hora, registro de acessos, CSV |
| Participantes | `/admin/participantes` | Administrador | Busca, liberação manual da entrada, exclusão, CSV |
| Relatórios | `/admin/relatorios` | Administrador | Movimento por dia e frequência por participante (7, 30 dias ou datas escolhidas) |

Endereços antigos (`/dashboard`, `/enroll`, `/reports`, `/settings`) redirecionam para os novos.

### Resultados na portaria

| Resultado | Cor | Quando |
|---|---|---|
| Acesso liberado | Lima `#C6F432` | Rosto reconhecido, primeira entrada do dia |
| Já entrou hoje | Âmbar `#FFB020` | Rosto reconhecido, mas a entrada do dia já foi registrada |
| Acesso negado | Vermelho `#D62839` | Rosto não cadastrado (oferece o cadastro) |
| Escaneando… | Azul scan `#2F5BFF` | Câmera procurando um rosto |

---

## 4. Identidade visual

| Cor | Hex | Uso |
|---|---|---|
| Tinta | `#0B1020` | Base: hero, rodapé, portaria, texto principal |
| Lima elétrico | `#C6F432` | Assinatura da marca e "acesso liberado" (texto sobre ele sempre Tinta) |
| Azul scan | `#2F5BFF` | Tecnologia: moldura da câmera lendo, links, foco de campos, gráficos |
| Lima texto | `#5E7A00` | Lima como texto sobre fundo claro |
| Grafite | `#1C2333` | Cards escuros |
| Cinza texto | `#5B6475` | Texto secundário |
| Borda / Névoa | `#E3E7DF` / `#F4F6F1` | Bordas / fundo claro |
| Âmbar / Vermelho | `#FFB020` / `#D62839` | Liberação manual / acesso negado |

Tipografia: **Archivo** (títulos, pesada) e **Inter** (texto). Tokens em `src/styles.css`
(classes `bg-tinta`, `text-lima`, `ring-scan`, `bg-nevoa`, etc.).

---

## 5. Arquitetura

```
Navegador (React + face-api)
   │  câmera → detecta o rosto e gera o vetor de 128 números no próprio computador
   │  (a foto nunca sai do navegador)
   ▼
API (Nitro / Node.js, hospedada na Vercel)
   │  compara o vetor com os cadastrados, decide liberado/negado e registra o acesso
   ▼
Banco de dados (Upstash Redis)
```

**Mudança importante da v2:** a comparação dos rostos passou para o servidor
(`POST /api/access/recognize`). Antes, a página baixava os vetores faciais de todos os alunos;
agora eles nunca saem do servidor.

### Stack

| Camada | Tecnologia |
|---|---|
| Interface | React 19, TanStack Start / Router, Tailwind CSS 4, shadcn/ui (Radix), TypeScript |
| Fontes | Archivo e Inter hospedadas no próprio site (Fontsource), com preload |
| Animações | CSS puro (hover, revelação ao rolar, moldura de leitura), respeitando `prefers-reduced-motion` |
| Build | Vite 7 |
| Reconhecimento facial | @vladmandic/face-api (sobre TensorFlow.js), rodando num Web Worker |
| Quiosque / PWA | Manifesto instalável, tela cheia, Wake Lock (tela sempre ligada), service worker com cache dos modelos |
| Testes | Playwright (desktop e celular) + axe (acessibilidade WCAG 2.1 AA) |
| Servidor / API | Nitro (Node.js) |
| Banco de dados | Upstash Redis, acessado via @vercel/kv |
| Hospedagem | Vercel |

---

## 6. Reconhecimento facial

Três modelos, carregados de `public/models/`: SSD MobileNet v1 (detectar), Face Landmark 68 (mapear)
e Face Recognition Net (gerar os 128 números).

- **Cadastro:** 5 fotos, cada uma conferida na hora (foto sem rosto é descartada). A média dos 5 vetores
  é enviada ao servidor. Fotos não são enviadas nem guardadas.
- **Cadastro duplicado:** recusado se o documento já existir ou se o rosto for muito parecido
  (distância ≤ 0,42) com alguém já cadastrado.
- **Portaria:** a cada ~1 segundo procura um rosto; ao encontrar, envia o vetor ao servidor. Mesma pessoa
  se a distância euclidiana for ≤ **0,5**. O resultado fica na tela por 4–5 segundos.
- A primeira análise prepara a GPU (pode levar ~12 s); isso acontece durante o carregamento da página.
- **Web Worker (v2.1):** a análise roda em `src/lib/face.worker.ts`, fora da thread da interface, então a
  câmera e as animações não travam durante a leitura. Cada quadro é reduzido para 640 px de largura antes da
  análise. Se o navegador não suportar worker com OffscreenCanvas, `face-main.ts` faz o trabalho na página,
  como na v2.
- **Cache:** `public/sw.js` guarda os modelos (~12 MB) e os arquivos do build; a partir da segunda visita a
  portaria abre sem baixar tudo de novo.

---

## 7. Regras de acesso

- **Uma entrada por pessoa por dia** (fuso de Brasília). Tentativas seguintes aparecem como "Já havia
  entrado" no registro.
- Toda tentativa é registrada: liberada, negada, duplicada ou liberação manual.
- **Liberação manual:** o administrador libera pelo nome em Participantes quando o reconhecimento falha
  (plano B previsto na arquitetura). Fica registrada como "Liberação manual".
- Ao excluir um participante, o vetor facial e o histórico dele são apagados; no registro do dia o nome
  aparece como "Participante removido".

---

## 8. Login do administrador

- Credenciais pelas variáveis de ambiente **`ADMIN_EMAIL`** e **`ADMIN_PASSWORD`** (configure na Vercel em
  *Settings → Environment Variables*). Opcional: `ADMIN_SESSION_SECRET` (se não definida, é derivada da senha;
  trocar a senha derruba as sessões abertas).
- **Em produção, sem essas variáveis o login fica desativado** (mensagem "Login de administrador não configurado").
- **Em desenvolvimento local**, sem as variáveis, vale o acesso de teste `admin@recface.local` / `recface123`.
- A sessão é um cookie `httpOnly` assinado (HMAC-SHA256), válido por 8 horas.

---

## 9. API

| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/api/health` | público | Verifica se o servidor está no ar |
| POST | `/api/access/recognize` | público (portaria) | Recebe o vetor facial, decide e registra o acesso |
| POST | `/api/enrollment` | público (portaria) | Cadastro: nome, documento, e-mail, consentimento, vetor |
| POST | `/api/auth/login` · `/api/auth/logout` | público | Entrar / sair |
| GET | `/api/auth/me` | admin | Sessão atual |
| GET | `/api/access/date/:data` | admin | Todas as tentativas de uma data (AAAA-MM-DD) |
| GET | `/api/students` · `/api/students/:id` | admin | Participantes (sem dados faciais) |
| DELETE | `/api/students/:id` | admin | Exclui participante e histórico |
| POST | `/api/attendance/register` | admin | Liberação manual da entrada |
| GET | `/api/attendance/today` · `/date/:data` · `/:id` | admin | Entradas (compatibilidade com a v1) |
| GET | `/api/face-descriptors` | admin | Vetores faciais (compatibilidade com a v1) |

Erros retornam JSON com o campo `message` em português.

### Dados no Redis

| Chave | Conteúdo |
|---|---|
| `student:{id}` | Participante: nome, documento (`registration_id`), e-mail, cadastro, consentimento, vetor facial |
| `students:index` | Conjunto com os IDs |
| `access:{AAAA-MM-DD}` | Todas as tentativas do dia (novo na v2) |
| `attendance:{AAAA-MM-DD}` · `attendance:student:{id}` | Entradas liberadas (mantidas da v1) |
| `cooldown:{id}:{AAAA-MM-DD}` | Trava de uma entrada por dia; guarda o horário da primeira entrada |

Os dados cadastrados na v1 continuam válidos (a matrícula passa a ser exibida como documento).

---

## 10. Estrutura de pastas

```
src/
  routes/          index (site), plataforma, login, admin (layout) + admin.index/participantes/relatorios
                   dashboard/enroll/reports/settings = redirecionamentos da v1
  components/      brand.tsx (logo e ilustrações), Navbar.tsx (site), admin/, ui/ (shadcn)
  lib/             api.ts, admin.ts, camera.ts, date.ts, reveal.ts (animação ao rolar), kiosk.ts (tela cheia/wake lock)
                   face-recognition.ts (interface), face.worker.ts (worker), face-main.ts (plano B)
server/
  routes/api/      rotas da API (um arquivo por rota)
  lib/             storage.ts (Redis), auth.ts (login), participants.ts (regras de acesso), date.ts
public/models/     pesos dos 3 modelos de reconhecimento
public/            manifest.webmanifest, sw.js, icons/ (app instalável)
tests/e2e/         testes Playwright + axe (site, portaria, login/painel, reconhecimento com câmera simulada)
scripts/           fix-vercel-output.mjs (ajuste pós-build para a Vercel)
```

---

## 11. Como rodar e publicar

```bash
bun install          # (npm install falha por conflito de peer deps; use bun)
bun run dev          # interface local
bun run build        # gera o build e aplica o ajuste do scripts/
bun run test:e2e     # testes de interface e acessibilidade (depois do build)
```

**Publicação:** o projeto `recface` da Vercel está ligado ao repositório
`github.com/cxrlos99leonel/RecFace`. Cada push na branch `main` publica automaticamente em
`recface-umber.vercel.app`. (O projeto antigo `presenca-facial` não recebe mais atualizações.)

Para o teste de reconhecimento com câmera simulada, coloque dois vídeos `.y4m` com rostos diferentes em
`tests/fixtures/rosto-a.y4m` e `rosto-b.y4m` (comando no topo de `tests/e2e/reconhecimento.spec.ts`).
Sem eles, o teste é pulado.

Variáveis na Vercel: `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Upstash) e **`ADMIN_EMAIL`, `ADMIN_PASSWORD`**.
O login atual (`user00adm`) é só de exemplo: troque antes de um uso real.

---

## 12. Histórico

| Etapa | O que foi feito |
|---|---|
| TAI 2 | Presença em laboratórios: reconhecimento no navegador, cadastro de alunos, painel e relatórios |
| Nov/2026 (v2) | Adaptação para a RecFace: site institucional, portaria com Reconhecer/Cadastrar, login de administrador, comparação facial no servidor, registro de todas as tentativas, liberação manual, consentimento LGPD obrigatório, nova identidade visual |
| Nov/2026 (v2.1) | Animações sutis, reconhecimento em Web Worker, fontes próprias, modo quiosque/PWA, testes automáticos de interface e acessibilidade; correções: login com preenchimento automático e tabelas roláveis pelo teclado |

---

## 13. Limitações e cuidados

- **Portaria aberta:** reconhecimento e cadastro não exigem login (é o uso na entrada). Em um evento real,
  o terminal deve ficar sob supervisão da equipe.
- **Sem prova de vivacidade:** uma foto do rosto na frente da câmera pode ser aceita.
- **Banco gratuito:** o plano Free do Upstash pode desativar bancos sem uso por longos períodos.
- **Câmera:** exige HTTPS e permissão do navegador; não funciona se outro programa estiver usando a webcam.
- **Precisão:** iluminação ruim, rosto de perfil ou óculos escuros reduzem a precisão.
- **Versão do TanStack Start fixada:** `@tanstack/react-start` 1.168.61 (com a correção de XSS
  CVE-2026-102989, exigida pela Vercel). A partir da 1.169 o pacote exige Vite 8; migrar para Vite 8 é
  uma evolução futura. Não troque para `^` sem testar o build.
- **Eventos múltiplos:** a v2 trata um único local/evento; cadastro de vários eventos fica como evolução.
