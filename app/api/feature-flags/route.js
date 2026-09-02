import { NextResponse } from 'next/server';
import { getAllFeatureFlags } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const flags = await getAllFeatureFlags();
    return NextResponse.json({
      flags: {
        gigs: flags.gigs ?? false,
        ...flags,
      }
    });
  } catch (err) {
    return NextResponse.json({
      flags: { gigs: false }
    });
  }
}
