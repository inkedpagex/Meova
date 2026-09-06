import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/colleges — Public list of all active colleges
 * Used in signup dropdown, onboarding, and ambassador application form.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('colleges')
      .select('id, name, city, state, domain')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[GET /api/colleges]', error.message);
      return NextResponse.json({ colleges: [] });
    }

    return NextResponse.json({ colleges: data || [] });
  } catch (err) {
    console.error('[GET /api/colleges]', err.message);
    return NextResponse.json({ colleges: [] });
  }
}
