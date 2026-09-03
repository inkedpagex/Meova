import React from 'react';
import Link from 'next/link';
import { requireHostOrAdmin } from '@/lib/getAdminUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import HostDashboardClient from './HostDashboardClient';
import { ShieldAlert, ArrowLeft } from '@/lib/icons';

export const metadata = {
  title: 'Campus Host Dashboard — Meova',
  description: 'Campus community moderation, student safety, and community leadership tools.',
};

export default async function HostPage() {
  const host = await requireHostOrAdmin();

  if (!host) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-[#F05A00]">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-black text-zinc-950 tracking-tight">Host Privileges Required</h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            This workspace is reserved for verified Campus Hosts and Community Leads. Contact a campus administrator to request host promotion.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 transition-all shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>Back to Campus Feed</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch initial moderation data server-side
  const [postsRes, profilesRes, circlesRes] = await Promise.all([
    supabaseAdmin
      .from('posts')
      .select('id, user_id, content, media_urls, category, location, created_at')
      .order('created_at', { ascending: false })
      .limit(40),
    supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, branch, year, role, is_blocked, status, photo_url, university, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('circles')
      .select('id, name, category, member_count, members_count, is_approved, creator_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const initialPosts = postsRes.data || [];
  const initialProfiles = profilesRes.data || [];
  const initialCircles = circlesRes.data || [];

  return (
    <HostDashboardClient
      host={host}
      initialPosts={initialPosts}
      initialProfiles={initialProfiles}
      initialCircles={initialCircles}
    />
  );
}
