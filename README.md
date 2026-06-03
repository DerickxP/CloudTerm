<div align="center">

```
▸ CloudTerm v2.4.1
```

# CloudTerm — Terminal de Monitoramento de Infraestrutura

**Painel de monitoramento de infraestrutura cloud com autenticação, dashboard de métricas em tempo real, log stream e integração com agente local via Supabase.**

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

</div>

---

## Sobre o projeto

CloudTerm é um **terminal de monitoramento de infraestrutura cloud**, desenvolvido como projeto da cadeira de **Web Performance**. A aplicação exibe em tempo real o estado de recursos do sistema (CPU, memória RAM, disco, rede, processos), com dados coletados por um agente local que envia métricas via API para um banco de dados na nuvem.

O dashboard consome os dados através de uma API Route do próprio Next.js, com autenticação por token, persistência no Supabase (PostgreSQL) e atualização automática a cada 3,5 segundos.

---

## Arquitetura

```
Windows (máquina monitorada)
  └── agente Node.js (agent.js)
        └── coleta métricas via `systeminformation`
              └── POST /api/metrics  (a cada 3s)
                    └── Next.js API Route (Vercel)
                          └── upsert → Supabase (PostgreSQL)
                                └── GET /api/metrics
                                      └── Dashboard (browser)
```

- O agente roda localmente na máquina a ser monitorada
- A API Route autentica cada requisição por Bearer token
- O Supabase mantém um snapshot único sempre atualizado
- O dashboard faz polling leve e detecta automaticamente se o agente ficou offline

---

## Telas

### Login — `/login`
Autenticação com estética de terminal. Validação em tempo real de e-mail e senha.

### Cadastro — `/cadastro`
Registro de novo operador com feedback visual de sucesso antes de redirecionar ao login.

### Dashboard — `/splash`
Painel principal com dados reais do sistema monitorado:

- **Sistema** — barras de progresso para CPU, RAM e Disco com cores reativas (verde → amarelo → vermelho conforme o uso)
- **Detalhes** — cards com uptime real, número de processos, tráfego de rede (RX/TX) e memória livre
- **Log Stream** — stream de eventos gerado a partir do estado real das métricas, com níveis `INFO`, `WARN` e `ERROR`, auto-scroll e cursor piscante
- **Status de conexão** — indicador `LIVE / STALE / OFFLINE` no header detectando automaticamente se o agente parou de enviar dados

---

## Stack

| Tecnologia | Versão | Função |
|---|---|---|
| [Next.js](https://nextjs.org/) | 15.3 | Framework principal, App Router, API Routes |
| [React](https://react.dev/) | 19 | Server e Client Components |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Tipagem estática |
| [Supabase](https://supabase.com/) | — | Banco de dados PostgreSQL na nuvem |
| [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) | 2 | SDK de acesso ao banco |
| [systeminformation](https://systeminformation.io/) | 5 | Coleta de métricas do sistema (agente) |
| [CSS Modules](https://nextjs.org/docs/app/building-your-application/styling/css-modules) | — | Estilos com escopo por componente |
| [next/font](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) | — | Fontes self-hosted |

---

## Estrutura de pastas

```
cloudterm/
├── src/
│   └── app/
│       ├── api/
│       │   └── metrics/
│       │       └── route.ts            # API Route — recebe (POST) e serve (GET) métricas
│       ├── components/                 # Componentes reutilizáveis
│       ├── login/                      # Tela de autenticação
│       ├── cadastro/                   # Tela de registro
│       ├── splash/
│       │   ├── page.tsx                # Server Component — entry point da rota
│       │   ├── DashboardClient.tsx     # Client Component — dashboard com dados reais
│       │   └── styles.module.css
│       ├── globals.css                 # Design tokens globais (CSS Variables)
│       ├── layout.tsx                  # Root layout com next/font
│       └── page.tsx                    # Redirect → /login
│
├── .env.example                        # Variáveis necessárias (sem valores reais)
├── supabase-setup.sql                  # SQL para criar a tabela no Supabase
├── next.config.ts
├── package.json
└── tsconfig.json

agent/                                  # Agente local (roda na máquina monitorada)
├── agent.js                            # Script de coleta e envio de métricas
├── package.json
└── iniciar-agente.bat                  # Instalador/iniciador para Windows
```

---

## Como configurar e executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ — tanto para o projeto quanto para o agente
- Conta gratuita no [Supabase](https://supabase.com)
- Conta na [Vercel](https://vercel.com) para o deploy

---

### 1. Supabase — criar a tabela

No painel do Supabase, vá em **SQL Editor → New Query**, cole o conteúdo de `supabase-setup.sql` e execute.

Em seguida, vá em **Project Settings → API Keys → Legacy** e copie:
- **Project URL** — formato `https://XXXXXXXXXXX.supabase.co`
- **anon** key
- **service_role** key

---

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
AGENT_SECRET_TOKEN=gere-uma-string-aleatória-forte
```

Para gerar o token do agente:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ O `.env.local` está no `.gitignore` — nunca commite as credenciais reais.

---

### 3. Executar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

### 4. Deploy na Vercel

1. Faça push do repositório para o GitHub
2. Importe o projeto em [vercel.com](https://vercel.com)
3. Em **Settings → Environment Variables**, adicione as 4 variáveis do `.env.example` com seus valores reais
4. Clique em **Deploy**

---

### 5. Agente local (Windows)

O agente coleta métricas reais do sistema e as envia para o dashboard.

Edite as duas primeiras linhas de `agent/agent.js`:

```js
const CLOUDTERM_URL = "https://seu-projeto.vercel.app/api/metrics";
const AGENT_TOKEN   = "o-mesmo-token-do-env";
```

Depois dê duplo clique em **`iniciar-agente.bat`** — instala as dependências automaticamente na primeira execução.

---

## Decisões de performance

### 1. Server Components por padrão
`page.tsx` e componentes sem interatividade são Server Components. O HTML chega renderizado ao cliente, melhorando **FCP** e **LCP** e reduzindo o bundle JS enviado ao browser.

### 2. `"use client"` apenas onde necessário
Somente `DashboardClient`, `LoginForm`, `CadastroForm` e componentes de formulário são Client Components — apenas onde há `useState`, `useEffect` ou eventos reais.

### 3. Polling leve no lugar de WebSocket
O dashboard usa `setInterval` com `fetch` a cada 3,5s em vez de WebSocket, pois o dado é um snapshot único que muda a essa frequência. Menos infraestrutura, mesmo resultado prático.

### 4. Upsert de registro único no banco
O agente sempre faz upsert no registro `id = 1`, sem acumular histórico. A tabela mantém uma linha e a query de leitura tem custo fixo O(1) independentemente do tempo de uso.

### 5. Detecção de staleness no cliente
Se o agente parar, o dashboard detecta automaticamente pela diferença entre `updated_at` e o horário atual — sem nenhum mecanismo adicional no servidor.

### 6. `useCallback` e refs para evitar re-renders
Handlers e timers usam `useCallback` e `useRef` para manter referências estáveis entre renders, evitando recriação de intervals a cada ciclo.

### 7. `next/font` com `display: swap`
Fontes JetBrains Mono e Inter são servidas de forma self-hosted em build time, eliminando requests externos e zerando o impacto no **CLS**.

### 8. CSS Modules sem runtime
Estilos em `.module.css` com nomes de classe gerados em build time — sem JavaScript de runtime para aplicar estilos, ao contrário de CSS-in-JS.

### 9. Animações 100% em CSS
Todos os efeitos visuais (`fadeSlideUp`, `blink`, `pulse`) são `@keyframes` em CSS puro, rodando na thread do compositor sem impacto no main thread.

---

## Design system

Tokens centralizados em `globals.css`:

```css
--color-bg:           #080c10   /* fundo principal            */
--color-surface:      #0d1117   /* superfície de cards        */
--color-accent:       #00ff9d   /* verde fósforo — destaque   */
--color-danger:       #ff4757   /* vermelho — erros           */
--color-warning:      #ffa502   /* amarelo — avisos           */
--color-text:         #e6edf3   /* texto principal            */
--color-text-muted:   #7d8590   /* texto secundário           */
```

Paleta inspirada em terminais Unix, com verde-fósforo como cor primária sobre fundo escuro profundo.

---

## Autor

Desenvolvido por **DerickxP** para a cadeira de Web Performance.

---

<div align="center">
  <sub>Projeto acadêmico — monitoramento real via agente local + Supabase + Vercel.</sub>
</div>
