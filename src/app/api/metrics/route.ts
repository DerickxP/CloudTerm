import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase admin client (service role — só no servidor)
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars não configuradas");
  return createClient(url, key);
}

// POST /api/metrics — chamado pelo agente local
export async function POST(req: NextRequest) {
  // Autenticação por token estático
  const auth = req.headers.get("authorization");
  const expectedToken = process.env.AGENT_SECRET_TOKEN;

  if (!expectedToken || auth !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  // Valida campos mínimos
  if (
    typeof payload.cpu !== "number" ||
    typeof payload.mem_used_mb !== "number" ||
    typeof payload.mem_total_mb !== "number"
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Upsert em snapshot único (sempre sobrescreve o registro id=1)
    const { error } = await supabase
      .from("metrics_snapshot")
      .upsert({
        id: 1,
        cpu: payload.cpu,
        mem_used_mb: payload.mem_used_mb,
        mem_total_mb: payload.mem_total_mb,
        disk_used_gb: payload.disk_used_gb ?? null,
        disk_total_gb: payload.disk_total_gb ?? null,
        uptime_seconds: payload.uptime_seconds ?? null,
        processes: payload.processes ?? null,
        network_rx_mb: payload.network_rx_mb ?? null,
        network_tx_mb: payload.network_tx_mb ?? null,
        hostname: payload.hostname ?? null,
        platform: payload.platform ?? null,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET /api/metrics — chamado pelo dashboard para ler dados
export async function GET(req: NextRequest) {
  // Aceita qualquer origem (o dashboard é público)
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("metrics_snapshot")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
