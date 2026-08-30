import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DEFAULT_GIGS = [
  {
    title: 'Figma UI Designer for Campus App',
    company: 'Meetuply Team',
    category: 'Design',
    budget: '500',
    reward_sparks: 500,
    duration: '3 Days',
    type: 'FREELANCE',
    desc: 'Looking for a talented student designer to create sleek UI mockups for our campus community events app.',
    status: 'open',
    applications_count: 0,
    created_at: new Date(Date.now() - 10000).toISOString(),
  },
  {
    title: 'Next.js Frontend Bug Fixes',
    company: 'Coding Club',
    category: 'Development',
    budget: '750',
    reward_sparks: 750,
    duration: '1 Week',
    type: 'PROJECT',
    desc: 'Help integrate Tailwind CSS components and optimize client page load speed for the annual tech fest website.',
    status: 'open',
    applications_count: 0,
    created_at: new Date(Date.now() - 20000).toISOString(),
  },
  {
    title: 'Campus Fest Poster & Reel Creation',
    company: 'Media Circle',
    category: 'Marketing',
    budget: '400',
    reward_sparks: 400,
    duration: '2 Days',
    type: 'CREATIVE',
    desc: 'Create 3 Instagram reels and event posters for the upcoming inter-college cultural fest.',
    status: 'open',
    applications_count: 0,
    created_at: new Date(Date.now() - 30000).toISOString(),
  }
];

export async function GET() {
  try {
    const { error } = await supabaseAdmin.from('gigs').insert(DEFAULT_GIGS);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, message: 'Successfully seeded mock gigs to Supabase.' });
  } catch (err) {
    console.error('[GET /api/admin/seed-gigs]', err.message);
    return NextResponse.json({ error: 'Failed to seed gigs' }, { status: 500 });
  }
}
