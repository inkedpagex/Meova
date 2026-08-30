import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = -1;

  try {
    const pingStart = Date.now();
    const { error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    dbLatencyMs = Date.now() - pingStart;
    dbStatus = error ? `error: ${error.message}` : 'healthy';
  } catch (err) {
    dbStatus = `error: ${err?.message || 'DB query failed'}`;
  }

  const memoryUsage = process.memoryUsage ? process.memoryUsage() : {};

  const healthData = {
    status: dbStatus === 'healthy' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    database: {
      provider: 'supabase',
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    system: {
      memoryRssMB: memoryUsage.rss ? Math.round(memoryUsage.rss / (1024 * 1024)) : 0,
      memoryHeapMB: memoryUsage.heapUsed ? Math.round(memoryUsage.heapUsed / (1024 * 1024)) : 0,
      nodeVersion: process.version,
    },
    totalResponseTimeMs: Date.now() - startTime,
  };

  const httpStatus = healthData.status === 'ok' ? 200 : 503;

  return NextResponse.json(healthData, {
    status: httpStatus,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
