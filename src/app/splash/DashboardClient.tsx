"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────
interface RealMetrics {
  cpu: number;
  mem_used_mb: number;
  mem_total_mb: number;
  disk_used_gb: number | null;
  disk_total_gb: number | null;
  uptime_seconds: number | null;
  processes: number | null;
  network_rx_mb: number | null;
  network_tx_mb: number | null;
  hostname: string | null;
  platform: string | null;
  updated_at: string;
}

interface LogEntry {
  id: number;
  time: string;
  level: "INFO" | "WARN" | "ERROR";
  msg: string;
}

type ConnectionStatus = "connecting" | "live" | "stale" | "offline";

// ──────────────────────────────────────────────
// Constantes fora do componente
// ──────────────────────────────────────────────
const POLL_INTERVAL_MS = 3500;
const STALE_THRESHOLD_MS = 12000; // considera offline se sem update por 12s

const LOG_TEMPLATES = {
  INFO: [
    (h: string) => `Heartbeat OK — ${h} [agente ativo]`,
    (h: string) => `Métricas recebidas de ${h}`,
    () => `Conexão com agente estável`,
    () => `Pool de polling sincronizado`,
  ],
  WARN: [
    (h: string) => `CPU elevada em ${h}`,
    (h: string) => `Memória alta em ${h}`,
    () => `Latência de resposta acima do normal`,
  ],
  ERROR: [
    () => `Agente sem resposta — verificando...`,
    () => `Timeout ao receber métricas`,
    (h: string) => `Conexão perdida com ${h}`,
  ],
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatMem(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)}GB`;
  return `${mb}MB`;
}

function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

function generateLog(
  id: number,
  metrics: RealMetrics | null,
  status: ConnectionStatus
): LogEntry {
  const host = metrics?.hostname ?? "host";
  let level: "INFO" | "WARN" | "ERROR" = "INFO";
  let msg = "";

  if (status === "offline" || status === "stale") {
    level = "ERROR";
    const templates = LOG_TEMPLATES.ERROR;
    msg = templates[Math.floor(Math.random() * templates.length)](host);
  } else if (metrics && (metrics.cpu > 85 || metrics.mem_used_mb / metrics.mem_total_mb > 0.9)) {
    level = "WARN";
    const templates = LOG_TEMPLATES.WARN;
    msg = templates[Math.floor(Math.random() * templates.length)](host);
  } else {
    const templates = LOG_TEMPLATES.INFO;
    msg = templates[Math.floor(Math.random() * templates.length)](host);
  }

  return { id, time: getCurrentTime(), level, msg };
}

const INITIAL_LOGS: LogEntry[] = [
  { id: 1, time: getCurrentTime(), level: "INFO", msg: "CloudTerm inicializado — aguardando agente..." },
];

// ──────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────
const MAX_LOGS = 60;

export default function DashboardClient() {
  const [metrics, setMetrics] = useState<RealMetrics | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logIdRef = useRef(INITIAL_LOGS.length + 1);
  const logListRef = useRef<HTMLDivElement>(null);
  const latestMetricsRef = useRef<RealMetrics | null>(null);
  const latestStatusRef = useRef<ConnectionStatus>("connecting");

  // Mantém refs atualizadas para usar nos timers sem capturar estado antigo
  useEffect(() => {
    latestMetricsRef.current = metrics;
    latestStatusRef.current = status;
  }, [metrics, status]);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => {
      const updated = [...prev, entry];
      return updated.length > MAX_LOGS ? updated.slice(-MAX_LOGS) : updated;
    });
  }, []);

  // Polling da API
  useEffect(() => {
    let mounted = true;
    let staleTimer: ReturnType<typeof setTimeout>;

    async function fetchMetrics() {
      clearTimeout(staleTimer);

      try {
        const res = await fetch("/api/metrics", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();

        if (!mounted) return;

        if (!json.data) {
          // API respondeu mas não há dados ainda (agente nunca enviou)
          setStatus("connecting");
          setError("Agente ainda não enviou dados. Execute o agente no seu PC.");
          return;
        }

        const data: RealMetrics = json.data;
        const updatedAt = new Date(data.updated_at);
        const age = Date.now() - updatedAt.getTime();

        setMetrics(data);
        setLastUpdate(updatedAt);
        setError(null);

        if (age > STALE_THRESHOLD_MS) {
          setStatus("stale");
        } else {
          setStatus("live");
        }

        // Timer para detectar staleness sem novo dado
        staleTimer = setTimeout(() => {
          if (mounted) setStatus("stale");
        }, STALE_THRESHOLD_MS);

      } catch (err: unknown) {
        if (!mounted) return;
        setStatus("offline");
        setError(err instanceof Error ? err.message : "Erro de conexão");
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(staleTimer);
    };
  }, []);

  // Log stream — gera logs baseados no estado real
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function scheduleNextLog() {
      const delay = 4000 + Math.random() * 4000;
      timeoutId = setTimeout(() => {
        const entry = generateLog(
          logIdRef.current++,
          latestMetricsRef.current,
          latestStatusRef.current
        );
        addLog(entry);
        scheduleNextLog();
      }, delay);
    }

    scheduleNextLog();
    return () => clearTimeout(timeoutId);
  }, [addLog]);

  // Auto-scroll log
  useEffect(() => {
    if (logListRef.current) {
      logListRef.current.scrollTop = logListRef.current.scrollHeight;
    }
  }, [logs]);

  // Valores derivados
  const cpuPct = metrics?.cpu ?? 0;
  const memPct = metrics ? Math.round((metrics.mem_used_mb / metrics.mem_total_mb) * 100) : 0;
  const diskPct = metrics?.disk_total_gb && metrics?.disk_used_gb
    ? Math.round((metrics.disk_used_gb / metrics.disk_total_gb) * 100)
    : null;

  const statusLabel: Record<ConnectionStatus, string> = {
    connecting: "CONECTANDO",
    live: "LIVE",
    stale: "STALE",
    offline: "OFFLINE",
  };

  const statusClass: Record<ConnectionStatus, string> = {
    connecting: styles.statusConnecting,
    live: styles.statusLive,
    stale: styles.statusStale,
    offline: styles.statusOffline,
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoAccent}>▸</span> CloudTerm
          <span className={styles.version}>v2.4.1</span>
          {metrics?.hostname && (
            <span className={styles.hostname}>@ {metrics.hostname}</span>
          )}
        </div>
        <div className={styles.headerRight}>
          <span className={`${styles.liveIndicator} ${statusClass[status]}`}>
            <span className={styles.liveDot} />
            {statusLabel[status]}
          </span>
          {lastUpdate && (
            <span className={styles.lastUpdate}>
              atualizado {lastUpdate.toTimeString().slice(0, 8)}
            </span>
          )}
          <Link href="/login" className={styles.logoutBtn}>
            Encerrar Sessão
          </Link>
        </div>
      </header>

      {/* Banner de erro / aguardando agente */}
      {error && (
        <div className={styles.errorBanner}>
          <span className={styles.errorIcon}>⚠</span>
          {error}
        </div>
      )}

      {status === "connecting" && !metrics && (
        <div className={styles.connectingBanner}>
          <span className={styles.connectingDots}>
            Aguardando dados do agente<span className={styles.cursorBlink}>_</span>
          </span>
          <p className={styles.connectingHint}>
            Execute <code>iniciar-agente.bat</code> no seu Windows para começar o monitoramento.
          </p>
        </div>
      )}

      <div className={styles.grid}>
        {/* ── Métricas do Sistema ── */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>
            <span className={styles.panelIcon}>⬡</span>
            Sistema
            {metrics?.platform && (
              <span className={styles.platformTag}>{metrics.platform}</span>
            )}
          </h2>

          <div className={styles.resourceList}>
            {/* CPU */}
            <div className={styles.resource}>
              <div className={styles.resourceHeader}>
                <span className={styles.resourceName}>CPU</span>
                <span className={`${styles.resourceValue} ${cpuPct > 85 ? styles.danger : cpuPct > 70 ? styles.warning : ""}`}>
                  {metrics ? `${cpuPct}%` : "—"}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${cpuPct > 85 ? styles.fillDanger : cpuPct > 70 ? styles.fillWarning : styles.fillOk}`}
                  style={{ width: metrics ? `${cpuPct}%` : "0%" }}
                />
              </div>
            </div>

            {/* RAM */}
            <div className={styles.resource}>
              <div className={styles.resourceHeader}>
                <span className={styles.resourceName}>Memória RAM</span>
                <span className={`${styles.resourceValue} ${memPct > 90 ? styles.danger : memPct > 75 ? styles.warning : ""}`}>
                  {metrics ? `${formatMem(metrics.mem_used_mb)} / ${formatMem(metrics.mem_total_mb)} (${memPct}%)` : "—"}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${memPct > 90 ? styles.fillDanger : memPct > 75 ? styles.fillWarning : styles.fillOk}`}
                  style={{ width: metrics ? `${memPct}%` : "0%" }}
                />
              </div>
            </div>

            {/* Disco */}
            <div className={styles.resource}>
              <div className={styles.resourceHeader}>
                <span className={styles.resourceName}>Disco (C:)</span>
                <span className={`${styles.resourceValue} ${diskPct && diskPct > 90 ? styles.danger : diskPct && diskPct > 75 ? styles.warning : ""}`}>
                  {metrics?.disk_used_gb != null && metrics?.disk_total_gb != null
                    ? `${metrics.disk_used_gb}GB / ${metrics.disk_total_gb}GB (${diskPct}%)`
                    : "—"}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${diskPct && diskPct > 90 ? styles.fillDanger : diskPct && diskPct > 75 ? styles.fillWarning : styles.fillOk}`}
                  style={{ width: diskPct ? `${diskPct}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Métricas Globais ── */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>
            <span className={styles.panelIcon}>◈</span>
            Detalhes
          </h2>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Uptime</span>
              <span className={styles.metricValue} style={{ fontSize: 18 }}>
                {metrics?.uptime_seconds != null ? formatUptime(metrics.uptime_seconds) : "—"}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Processos</span>
              <span className={styles.metricValue}>
                {metrics?.processes ?? "—"}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Rede RX</span>
              <span className={styles.metricValue} style={{ fontSize: 16 }}>
                {metrics?.network_rx_mb != null ? `${metrics.network_rx_mb}MB` : "—"}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Rede TX</span>
              <span className={styles.metricValue} style={{ fontSize: 16 }}>
                {metrics?.network_tx_mb != null ? `${metrics.network_tx_mb}MB` : "—"}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>CPU</span>
              <span className={`${styles.metricValue} ${cpuPct > 85 ? styles.danger : ""}`}>
                {metrics ? `${cpuPct}` : "—"}
                {metrics && <span className={styles.metricUnit}>%</span>}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>RAM livre</span>
              <span className={styles.metricValue} style={{ fontSize: 16 }}>
                {metrics
                  ? formatMem(metrics.mem_total_mb - metrics.mem_used_mb)
                  : "—"}
              </span>
            </div>
          </div>
        </section>

        {/* ── Log Stream ── */}
        <section className={`${styles.panel} ${styles.panelFull}`}>
          <h2 className={styles.panelTitle}>
            <span className={styles.panelIcon}>▤</span>
            Log Stream
            <span className={styles.liveTag}>
              {status === "live" ? "streaming" : status}
            </span>
          </h2>
          <div className={styles.logList} ref={logListRef}>
            {logs.map((log) => (
              <div key={log.id} className={styles.logLine}>
                <span className={styles.logTime}>{log.time}</span>
                <span className={`${styles.logLevel} ${styles[log.level.toLowerCase()]}`}>
                  [{log.level}]
                </span>
                <span className={styles.logMsg}>{log.msg}</span>
              </div>
            ))}
            <div className={styles.logLine}>
              <span className={styles.logTime}>{getCurrentTime()}</span>
              <span className={`${styles.logLevel} ${styles.info}`}>[INFO]</span>
              <span className={styles.logMsg}>
                Monitorando {metrics?.hostname ?? "host"}
                <span className={styles.cursorBlink}>_</span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
