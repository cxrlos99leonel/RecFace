<p align="right">
  <a href="README.md"><img src="https://img.shields.io/badge/lang-English-0B1020?style=flat-square" alt="Read in English"></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/idioma-Portugu%C3%AAs-C6F432?style=flat-square&labelColor=0B1020" alt="Ler em português"></a>
</p>

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/brand/recface-logo-escuro.svg">
  <img src="public/brand/recface-logo-claro.svg" alt="RecFace" height="64">
</picture>

### Olhe. Entre. Curta.

**Controle de acesso por reconhecimento facial, direto no navegador.**
Sem fila, sem ingresso no celular e sem guardar a foto de ninguém.

[![Site no ar](https://img.shields.io/badge/site-recface--umber.vercel.app-C6F432?style=for-the-badge&labelColor=0B1020)](https://recface-umber.vercel.app)

![React 19](https://img.shields.io/badge/React-19-0B1020?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-0B1020?logo=typescript&logoColor=3178C6)
![TanStack Start](https://img.shields.io/badge/TanStack-Start-0B1020?logo=reactquery&logoColor=FF4154)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4-0B1020?logo=tailwindcss&logoColor=38BDF8)
![TensorFlow.js](https://img.shields.io/badge/face--api-TensorFlow.js-0B1020?logo=tensorflow&logoColor=FF6F00)
![Redis](https://img.shields.io/badge/Upstash-Redis-0B1020?logo=redis&logoColor=FF4438)
![Vercel](https://img.shields.io/badge/deploy-Vercel-0B1020?logo=vercel&logoColor=white)
![Playwright](https://img.shields.io/badge/testes-Playwright%20%2B%20axe-0B1020?logo=playwright&logoColor=2EAD33)

</div>

<p align="center">
  <img src="docs/prototipo/site-hero.png" alt="Página inicial da RecFace" width="100%">
</p>

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Telas](#telas)
- [Funcionalidades](#funcionalidades)
- [Destaques técnicos](#destaques-técnicos)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Limitações e próximos passos](#limitações-e-próximos-passos)
- [Equipe](#equipe)
- [Licença](#licença)

---

## Sobre o projeto

A **RecFace** é uma plataforma de controle de acesso para **eventos, festas, cinemas e empresas**.
O participante cadastra o rosto uma única vez; na entrada, basta olhar para a câmera. O sistema reconhece a
pessoa em segundos, libera o acesso e registra data e horário. O organizador acompanha tudo em um painel
administrativo ao vivo.

O projeto nasceu como Trabalho Acadêmico Integrado (TAI) do curso de **Ciência da Computação da PUC Minas**
e passou por duas versões:

| Versão | Contexto | O que mudou |
|---|---|---|
| **v1** (TAI 2) | Presença de alunos em laboratórios | Motor de reconhecimento no navegador, cadastro, painel e relatórios |
| **v2** (TAI 3) | Empresa RecFace: acesso a eventos | Site institucional, portaria com cadastro e reconhecimento, login de administrador, comparação facial no servidor, consentimento LGPD, nova identidade visual |
| **v2.1** | Desempenho e qualidade | Reconhecimento em Web Worker, modo quiosque (PWA), cache dos modelos, testes automáticos de interface e acessibilidade |

> **Privacidade por padrão:** a foto é analisada no próprio navegador e descartada. Só um vetor de 128 números,
> que não permite reconstruir a imagem do rosto, é enviado ao servidor.

---

## Telas

> Imagens do protótipo de alta fidelidade que guiou a implementação (os dados exibidos são ilustrativos).

### Portaria: reconhecimento e cadastro

| Acesso liberado | Acesso negado |
|---|---|
| ![Portaria com acesso liberado](docs/prototipo/portaria-acesso-liberado.png) | ![Portaria com acesso negado](docs/prototipo/portaria-acesso-negado.png) |

| Cadastro do rosto (5 fotos + termo LGPD) |
|---|
| ![Cadastro de participante](docs/prototipo/portaria-cadastro.png) |

### Área do administrador

| Login | Painel |
|---|---|
| ![Login do administrador](docs/prototipo/admin-login.png) | ![Painel do administrador](docs/prototipo/admin-painel.png) |

<details>
<summary><b>Ver a página inicial completa</b></summary>
<br>
<img src="docs/prototipo/site-pagina-inicial.png" alt="Página inicial completa da RecFace">
</details>

---

## Funcionalidades

**Para o participante**
- Cadastro guiado em menos de um minuto: 5 fotos do rosto, cada uma validada na hora, e aceite do termo da LGPD
- Reconhecimento na portaria em segundos, com resposta visual clara: **liberado**, **negado** ou **já entrou hoje**
- Se o rosto não for reconhecido, a tela oferece o cadastro na hora

**Para o organizador**
- Painel com entradas do dia atualizadas a cada 10 segundos e gráfico de entradas por hora
- Registro de **todas** as tentativas (liberadas, negadas, duplicadas e liberações manuais)
- Gestão de participantes: busca, liberação manual quando o reconhecimento falha e exclusão com apagamento do histórico
- Relatórios por período (7 dias, 30 dias ou datas escolhidas) com exportação em CSV

**Regras de negócio**
- Uma entrada por pessoa por dia (fuso de Brasília)
- Cadastro duplicado é recusado por documento **ou** por semelhança facial com alguém já cadastrado

---

## Destaques técnicos

| Desafio | Solução |
|---|---|
| **Privacidade dos dados biométricos** | Detecção e extração do vetor facial (128 dimensões) acontecem no navegador; nenhuma foto sai do aparelho nem é armazenada. |
| **Não expor a base de rostos** | Na v1 a página baixava os vetores de todos os cadastrados. Na v2 a comparação foi movida para o servidor (`POST /api/access/recognize`) e os vetores nunca saem dele. |
| **Interface travando durante a análise** | O reconhecimento roda em um **Web Worker** com `OffscreenCanvas`, fora da thread da interface. Cada quadro é reduzido para 640 px antes da análise. Há um *fallback* na página para navegadores sem suporte. |
| **Primeira análise lenta** | O aquecimento da GPU (~12 s) é feito durante o carregamento da página, antes do primeiro rosto aparecer. |
| **Modelos pesados (~12 MB)** | *Service worker* guarda os modelos e o build em cache; da segunda visita em diante a portaria abre sem baixar tudo de novo. |
| **Terminal de entrada** | Modo quiosque/PWA: app instalável, tela cheia e *Wake Lock* para a tela não apagar. |
| **Precisão x falsos positivos** | Mesma pessoa se a distância euclidiana entre vetores for ≤ 0,5; cadastro bloqueado se houver alguém a ≤ 0,42. O vetor cadastrado é a média de 5 capturas. |
| **Segurança do painel** | Sessão em cookie `httpOnly` assinado com HMAC-SHA256, válida por 8 horas; senha comparada em tempo constante; login desativado em produção sem credenciais configuradas. |
| **Qualidade e acessibilidade** | Testes *end-to-end* com Playwright em desktop e celular, incluindo verificação WCAG 2.1 AA com axe, respeito a `prefers-reduced-motion` e um teste de reconhecimento com câmera simulada. |

---

## Arquitetura

```mermaid
flowchart LR
    subgraph Navegador["Navegador (portaria)"]
        CAM[Câmera] --> W["Web Worker<br/>face-api / TensorFlow.js"]
        W -->|"vetor de 128 números<br/>(a foto é descartada)"| UI[Interface React]
    end

    UI -->|"POST /api/access/recognize<br/>POST /api/enrollment"| API

    subgraph Vercel
        API["API Nitro (Node.js)<br/>compara vetores, aplica regras<br/>e registra o acesso"]
    end

    API <--> DB[("Upstash Redis<br/>participantes, vetores<br/>e registro de acessos")]

    ADM[Painel do administrador] -->|"cookie de sessão assinado"| API
```

**Modelos de reconhecimento** (carregados de `public/models/`):
SSD MobileNet v1 (detecção) → Face Landmark 68 (pontos do rosto) → Face Recognition Net (vetor de 128 dimensões).

<details>
<summary><b>Rotas da API</b></summary>

| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/api/health` | público | Verifica se o servidor está no ar |
| POST | `/api/access/recognize` | portaria | Recebe o vetor facial, decide e registra o acesso |
| POST | `/api/enrollment` | portaria | Cadastro: nome, documento, e-mail, consentimento e vetor |
| POST | `/api/auth/login` · `/api/auth/logout` | público | Entrar / sair |
| GET | `/api/auth/me` | admin | Sessão atual |
| GET | `/api/access/date/:data` | admin | Todas as tentativas de uma data |
| GET | `/api/students` · `/api/students/:id` | admin | Participantes (sem dados faciais) |
| DELETE | `/api/students/:id` | admin | Exclui participante e histórico |
| POST | `/api/attendance/register` | admin | Liberação manual da entrada |

</details>

---

## Stack

| Camada | Tecnologias |
|---|---|
| **Front-end** | React 19, TypeScript, TanStack Start / Router, Tailwind CSS 4, shadcn/ui (Radix), Recharts |
| **Visão computacional** | @vladmandic/face-api sobre TensorFlow.js, em Web Worker |
| **Back-end** | Nitro (Node.js), rotas de API por arquivo |
| **Banco de dados** | Upstash Redis via @vercel/kv |
| **PWA / Quiosque** | Web App Manifest, Service Worker, Fullscreen API, Wake Lock API |
| **Testes** | Playwright (desktop + celular) e @axe-core/playwright |
| **Build e deploy** | Vite 7, Bun, Vercel (deploy contínuo a cada push na `main`) |

---

## Como rodar

**Pré-requisitos:** [Bun](https://bun.sh) instalado (o `npm install` falha por conflito de *peer dependencies*).

```bash
git clone https://github.com/cxrlos99leonel/RecFace.git
cd RecFace
bun install
bun run dev
```

Sem variáveis de ambiente, os dados ficam em memória e vale um login de teste **somente local** para o painel:
`admin@recface.local` / `recface123`. Esse acesso fica desativado em produção.

**Testes de interface e acessibilidade**

```bash
bun run build
bun run test:e2e
```

**Variáveis de ambiente (produção)**

| Variável | Uso |
|---|---|
| `KV_REST_API_URL` · `KV_REST_API_TOKEN` | Conexão com o Upstash Redis |
| `ADMIN_EMAIL` · `ADMIN_PASSWORD` | Credenciais do administrador |
| `ADMIN_SESSION_SECRET` | Opcional: segredo para assinar a sessão |

> A câmera exige HTTPS (ou `localhost`) e permissão do navegador.

---

## Estrutura do projeto

```
src/
  routes/        páginas: site (/), portaria (/plataforma), login e painel (/admin)
  components/    marca, navegação, componentes do painel e de interface (shadcn/ui)
  lib/           câmera, reconhecimento (worker + fallback), API, modo quiosque
server/
  routes/api/    rotas da API, um arquivo por rota
  lib/           Redis, autenticação, regras de acesso, datas
public/
  models/        pesos dos três modelos de reconhecimento
  brand/         logos e símbolo da RecFace
tests/e2e/       testes Playwright + axe
docs/prototipo/  imagens do protótipo usadas neste README
```

Detalhes completos de arquitetura, regras de negócio e histórico em
[`CONTEXTO-DO-PROJETO.md`](CONTEXTO-DO-PROJETO.md).

---

## Limitações e próximos passos

- [ ] **Prova de vivacidade** (*liveness*): hoje uma foto do rosto diante da câmera pode ser aceita
- [ ] **Múltiplos eventos** por organizador (a versão atual trata um único local/evento)
- [ ] **Limite de requisições** (*rate limiting*) nas rotas públicas
- [ ] **Migração para Vite 8** e versões mais novas do TanStack Start
- [ ] Portaria aberta por design: em uso real, o terminal deve ficar sob supervisão da equipe
- [ ] Precisão cai com iluminação ruim, rosto de perfil ou óculos escuros

---

## Equipe

Projeto desenvolvido em equipe no curso de Ciência da Computação da **PUC Minas**.

**Integrantes:** Carlos Eduardo Divino Souza Leonel · Henrique Rodrigues Martins · João Vitor Garçon dos Reis ·
Jonas Henrique Teixeira · Luis Augusto de Oliveira Bordin

**Orientadores:** Diego Roberto Gonçalves de Pontes · Udo Fritzke Junior · Will Ricardo dos Santos Machado

---

## Licença

© 2026 Equipe RecFace. **Todos os direitos reservados.** O código está público apenas para fins de portfólio e
avaliação acadêmica: pode ser lido, mas não copiado, modificado, distribuído ou usado sem autorização por escrito.
Veja [`LICENSE`](LICENSE) e a [política de segurança](SECURITY.md).

---

<div align="center">
  <sub>Tecnologia para conectar pessoas a novas experiências.</sub>
</div>
