import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = -1;

  try {
    if (adminDb) {
      const pingStart = Date.now();
      // Fast single-doc query to test database latency
      await adminDb.collection('users').limit(1).get();
      dbLatencyMs = Date.now() - pingStart;
      dbStatus = 'healthy';
    }
  } catch (err) {
    dbStatus = `error: ${err?.message || 'DB query failed'}`;
  }

  const memoryUsage = process.memoryUsage ? process.memoryUsage() : {};

  const healthData = {
    status: dbStatus === 'healthy' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    database: {
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
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
