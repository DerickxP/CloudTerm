# CloudTerm: painel de monitoramento de infraestrutura

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

Painel com estética de terminal que mostra o estado de uma máquina (CPU, memória,
disco, rede, processos e uptime) a partir de métricas enviadas por um agente local.
As métricas chegam por uma API Route do Next.js autenticada por token, ficam em um
snapshot no Supabase (PostgreSQL) e o dashboard se atualiza a cada 3,5 segundos.

> Projeto acadêmico da cadeira de Web Performance.

## Como funciona

```
Máquina monitorada
  └── agente (envia as métricas)
        └── POST /api/metrics          Bearer token
              └── Next.js API Route
                    └── upsert → Supabase (linha única, id = 1)
                          └── GET /api/metrics
                                └── Dashboard (polling a cada 3,5 s)
```

- **`/splash` (dashboard):** barras de CPU, RAM e disco com cor por faixa de uso;
  cards de uptime, processos, tráfego de rede e memória livre; um log stream com
  níveis `INFO`, `WARN` e `ERROR` gerado a partir das métricas; e o indicador
  `LIVE`, `STALE` ou `OFFLINE`, que marca o agente como parado após 12 s sem dados.
- **`/login` e `/cadastro`:** telas com validação dos campos no cliente. A
  autenticação é simulada: após validar, a tela redireciona sem consultar backend.

## Decisões de performance

- **Server Components por padrão.** `"use client"` só no dashboard e nos formulários.
- **Polling em vez de WebSocket.** O dado é um snapshot único; `fetch` a cada 3,5 s
  resolve com menos infraestrutura.
- **Upsert em uma linha só.** A tabela não acumula histórico, então a leitura tem
  custo constante.
- **Detecção de agente parado no cliente**, comparando `updated_at` com a hora atual.
- **`useCallback` e `useRef`** para manter handlers e timers estáveis entre renders.
- **`next/font` com `display: swap`** (JetBrains Mono e Inter servidas pelo próprio app).
- **CSS Modules e animações em `@keyframes`**, sem CSS-in-JS em runtime.

## Como rodar

Requisitos: Node.js 18+ e um projeto no [Supabase](https://supabase.com).

1. No Supabase, abra **SQL Editor → New Query** e execute `supabase-setup.sql`
   (cria a tabela `metrics_snapshot` com RLS e a linha inicial).
2. Copie `.env.example` para `.env.local` e preencha a URL do projeto, as chaves
   `anon` e `service_role` e um `AGENT_SECRET_TOKEN`. Para gerar o token:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Rode o app:
   ```bash
   npm install
   npm run dev     # http://localhost:3000
   ```

Para deploy na Vercel, cadastre as mesmas quatro variáveis em
**Settings → Environment Variables**.

Para enviar métricas de teste sem o agente:

```bash
curl -X POST http://localhost:3000/api/metrics \
  -H "Authorization: Bearer $AGENT_SECRET_TOKEN" -H "Content-Type: application/json" \
  -d '{"cpu": 42.5, "mem_used_mb": 6144, "mem_total_mb": 16384}'
```

`cpu`, `mem_used_mb` e `mem_total_mb` são obrigatórios; os demais campos de
`metrics_snapshot` (disco, uptime, processos, rede, hostname, plataforma) são opcionais.

## Limitações

- **O agente de coleta não está neste repositório**; o endpoint aceita qualquer
  processo que envie o token.
- **Login e cadastro são só interface**, sem autenticação real de usuário.
- O `GET /api/metrics` é público, e o painel mostra uma única máquina.

## Licença

[MIT](LICENSE)
