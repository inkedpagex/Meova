import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { getAllFeatureFlags, setFeatureFlag } from '@/lib/featureFlags';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const flags = await getAllFeatureFlags();
    return NextResponse.json({ flags });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { featureName, enabled } = await request.json();
    if (!featureName || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const result = await setFeatureFlag(featureName, enabled);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update flag' }, { status: 500 });
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      admin_id: admin.uid,
      admin_uid: admin.uid,
      action: 'toggle_feature_flag',
      message: `Admin toggled feature "${featureName}" to ${enabled ? 'ENABLED' : 'DISABLED'}`,
      details: { featureName, enabled },
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Feature "${featureName}" is now ${enabled ? 'ENABLED' : 'DISABLED'}`,
      flags: await getAllFeatureFlags(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
