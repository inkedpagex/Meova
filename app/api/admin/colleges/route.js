import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/colleges — List all colleges
 * POST /api/admin/colleges — Add a new college
 * PATCH /api/admin/colleges — Update a college (toggle active, rename, etc.)
 */

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('colleges')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ colleges: [] });
  }

  return NextResponse.json({ colleges: data || [] });
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { name, city, state, domain } = await request.json();

  if (!name?.trim()) return NextResponse.json({ error: 'College name is required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('colleges')
    .insert({
      name: name.trim(),
      city: city?.trim() || null,
      state: state?.trim() || null,
      domain: domain?.trim().toLowerCase() || null,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    console.error('[POST /api/admin/colleges]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, college: data });
}

export async function PATCH(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id, name, city, state, domain, is_active } = await request.json();

  if (!id) return NextResponse.json({ error: 'College id required' }, { status: 400 });

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (city !== undefined) updates.city = city?.trim() || null;
  if (state !== undefined) updates.state = state?.trim() || null;
  if (domain !== undefined) updates.domain = domain?.trim().toLowerCase() || null;
  if (is_active !== undefined) updates.is_active = Boolean(is_active);

  const { error } = await supabaseAdmin.from('colleges').update(updates).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'College id required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('colleges').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
