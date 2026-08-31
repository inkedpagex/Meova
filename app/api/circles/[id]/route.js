import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Circle ID is required' }, { status: 400 });

    const { data: circle, error } = await supabaseAdmin
      .from('circles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !circle) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, circle });
  } catch (err) {
    console.error('[GET /api/circles/[id]]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Circle ID is required' }, { status: 400 });

    const { data: circle, error: fetchErr } = await supabaseAdmin
      .from('circles')
      .select('id, creator_id, name')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !circle) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const isAdmin = user.role === 'admin';
    const isHost = circle.creator_id === user.uid;

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Only the host or admin can edit this community.' }, { status: 403 });
    }

    const body = await request.json();
    const { description, invite_link, platform, price, initial_members_count, image } = body;

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (description !== undefined) updates.description = String(description).trim();
    if (invite_link !== undefined) {
      const cleanLink = String(invite_link).trim();
      if (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
        return NextResponse.json({ error: 'Valid URL required (must start with https://)' }, { status: 400 });
      }
      updates.invite_link = cleanLink;
    }
    if (platform !== undefined) updates.platform = platform;
    if (price !== undefined) {
      const priceNum = Math.max(0, parseInt(price, 10) || 0);
      updates.price = priceNum;
      updates.is_paid = priceNum > 0;
    }
    if (image !== undefined) updates.image = image;
    if (initial_members_count !== undefined) {
      const countNum = Math.max(1, parseInt(initial_members_count, 10) || 1);
      updates.member_count = countNum;
      updates.members_count = countNum;
    }

    const { data: updatedCircle, error: updateErr } = await supabaseAdmin
      .from('circles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('[PATCH /api/circles/[id]] update error:', updateErr.message);
      return NextResponse.json({ error: 'Failed to update community' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      circle: updatedCircle,
      message: 'Community updated successfully'
    });
  } catch (err) {
    console.error('[PATCH /api/circles/[id]]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
