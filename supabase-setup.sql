-- Execute este SQL no Supabase SQL Editor:
-- supabase.com → seu projeto → SQL Editor → New Query → cole e execute

CREATE TABLE IF NOT EXISTS metrics_snapshot (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  cpu             NUMERIC(5,2)   NOT NULL,
  mem_used_mb     INTEGER        NOT NULL,
  mem_total_mb    INTEGER        NOT NULL,
  disk_used_gb    NUMERIC(8,1),
  disk_total_gb   NUMERIC(8,1),
  uptime_seconds  BIGINT,
  processes       INTEGER,
  network_rx_mb   BIGINT,
  network_tx_mb   BIGINT,
  hostname        TEXT,
  platform        TEXT,
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Garante que só existe uma linha (snapshot único do PC)
CREATE UNIQUE INDEX IF NOT EXISTS metrics_snapshot_id_idx ON metrics_snapshot (id);

-- Row Level Security: qualquer pessoa autenticada pode ler, apenas service_role pode escrever
ALTER TABLE metrics_snapshot ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (o dashboard lê via service_role, mas esta política
-- permite leitura via anon key também se necessário)
CREATE POLICY "allow_read" ON metrics_snapshot
  FOR SELECT USING (true);

-- Escrita apenas via service_role (o agente passa pela API Next.js que usa service_role)
-- Não é necessária uma política de escrita porque service_role bypassa o RLS.

-- Insere uma linha inicial para o upsert funcionar na primeira vez
INSERT INTO metrics_snapshot (id, cpu, mem_used_mb, mem_total_mb, updated_at)
VALUES (1, 0, 0, 1, NOW())
ON CONFLICT (id) DO NOTHING;
