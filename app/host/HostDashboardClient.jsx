'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, ShieldAlert, Trash2, Ban, CheckCircle2,
  Search, Users, Sparkles, MessageCircle, AlertTriangle,
  ArrowLeft, RefreshCw, X, Check, Lock, ExternalLink
} from '@/lib/icons';
import HostBadge from '@/components/HostBadge';
import CustomSelect from '@/components/CustomSelect';
import { getCartoonAvatar } from '@/utils/avatar';
import { formatPostDate } from '@/utils/dateFormatter';
import { toast } from '@/lib/toast';

export default function HostDashboardClient({
  host,
  initialPosts = [],
  initialProfiles = [],
  initialCircles = [],
}) {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'students' | 'logs' | 'circles'

  // Data states
  const [posts, setPosts] = useState(initialPosts);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [circles, setCircles] = useState(initialCircles);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Search states
  const [postSearch, setPostSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Modals state
  const [moderatingPost, setModeratingPost] = useState(null); // post object to delete
  const [postDeleteReason, setPostDeleteReason] = useState('Spam / Fake Content');
  const [customPostReason, setCustomPostReason] = useState('');
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const [suspendingUser, setSuspendingUser] = useState(null); // user object to suspend
  const [suspendReason, setSuspendReason] = useState('Fake profile / Impersonation');
  const [customSuspendReason, setCustomSuspendReason] = useState('');
  const [isSuspendingUser, setIsSuspendingUser] = useState(false);

  // Fetch audit logs when tab is selected
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/host/logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch {
      toast.error('Failed to load moderation history');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'logs' && logs.length === 0) {
      fetchLogs();
    }
  };

  // Filtered posts
  const filteredPosts = useMemo(() => {
    if (!postSearch.trim()) return posts;
    const q = postSearch.toLowerCase();
    return posts.filter(p =>
      (p.content || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q)
    );
  }, [posts, postSearch]);

  // Filtered students
  const filteredProfiles = useMemo(() => {
    if (!studentSearch.trim()) return profiles;
    const q = studentSearch.toLowerCase();
    return profiles.filter(u =>
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.branch || '').toLowerCase().includes(q) ||
      (u.university || '').toLowerCase().includes(q)
    );
  }, [profiles, studentSearch]);

  // Execute Post Deletion
  const handleConfirmDeletePost = async () => {
    if (!moderatingPost) return;
    const finalReason = postDeleteReason === 'Other' ? customPostReason : postDeleteReason;
    if (!finalReason || finalReason.trim().length < 3) {
      toast.error('Please specify a valid moderation reason.');
      return;
    }

    setIsDeletingPost(true);
    try {
      const res = await fetch('/api/host/moderate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: moderatingPost.id,
          action: 'delete',
          reason: finalReason.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete post');
      }

      toast.success('Post removed from campus feed!');
      // Optimistically remove from state
      setPosts(prev => prev.filter(p => p.id !== moderatingPost.id));
      setModeratingPost(null);
      setCustomPostReason('');
    } catch (err) {
      toast.error(err.message || 'Error moderating post');
    } finally {
      setIsDeletingPost(false);
    }
  };

  // Execute User Suspension / Reinstatement
  const handleToggleSuspendUser = async () => {
    if (!suspendingUser) return;
    const willSuspend = !(suspendingUser.is_blocked || suspendingUser.status === 'blocked');
    const finalReason = willSuspend
      ? (suspendReason === 'Other' ? customSuspendReason : suspendReason)
      : 'Reinstated by Host';

    if (willSuspend && (!finalReason || finalReason.trim().length < 3)) {
      toast.error('Please specify a valid suspension reason.');
      return;
    }

    setIsSuspendingUser(true);
    try {
      const res = await fetch('/api/host/suspend-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUid: suspendingUser.id,
          isSuspended: willSuspend,
          reason: finalReason.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update user status');
      }

      toast.success(willSuspend ? 'Student suspended from campus!' : 'Student reinstated!');
      // Update local state
      setProfiles(prev =>
        prev.map(u =>
          u.id === suspendingUser.id
            ? { ...u, is_blocked: willSuspend, status: willSuspend ? 'blocked' : 'active' }
            : u
        )
      );
      setSuspendingUser(null);
      setCustomSuspendReason('');
    } catch (err) {
      toast.error(err.message || 'Error updating user');
    } finally {
      setIsSuspendingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]/80 text-[#1C1917] pb-20 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-[#E7E5E4]/80 px-3.5 sm:px-6 py-2.5 sm:py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="w-8 h-8 rounded-full bg-[#FAFAF8] border border-[#E7E5E4]/80 flex items-center justify-center text-[#78716C] hover:text-[#1C1917] hover:bg-[var(--accent-tint-10)] transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight text-[#1C1917] truncate">Campus Host Hub</span>
                <HostBadge role={host.role} size="xs" className="flex-shrink-0" />
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#78716C] truncate">
                GLA Campus Moderation & Safety
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#FAFAF8] hover:bg-[var(--accent-tint-10)] border border-[#E7E5E4]/80 transition-all cursor-pointer whitespace-nowrap"
              title="Go to Profile"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[var(--bg-surface)] flex-shrink-0">
                <img
                  src={host.photo_url || getCartoonAvatar(host.full_name || 'Host')}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-bold text-[#1C1917] whitespace-nowrap pr-0.5">
                Profile
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-[#E7E5E4]/80 rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Campus Students</p>
            <h3 className="text-2xl font-bold text-[#1C1917] mt-1">{profiles.length}+</h3>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
              Active Roster
            </span>
          </div>

          <div className="bg-white border border-[#E7E5E4]/80 rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Moments Moderated</p>
            <h3 className="text-2xl font-bold text-[#1C1917] mt-1">{posts.length}</h3>
            <span className="text-[10px] text-[var(--accent)] font-bold bg-[var(--accent-tint-10)] px-2 py-0.5 rounded-full mt-1.5 inline-block">
              Live Feed Watch
            </span>
          </div>

          <div className="bg-white border border-[#E7E5E4]/80 rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Campus Circles</p>
            <h3 className="text-2xl font-bold text-[#1C1917] mt-1">{circles.length}</h3>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
              Communities
            </span>
          </div>

          <div className="bg-white border border-[#E7E5E4]/80 rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">Suspended Spammers</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">
              {profiles.filter(p => p.is_blocked || p.status === 'blocked').length}
            </h3>
            <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
              Blocked Accounts
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-surface)] border border-[#E7E5E4]/80 rounded-[16px] overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('feed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-[var(--accent)] text-white shadow-sm shadow-purple-500/20'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/80'
            }`}
          >
            <Trash2 size={14} />
            <span>Feed Moderation ({posts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-[var(--accent)] text-white shadow-sm shadow-purple-500/20'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/80'
            }`}
          >
            <Users size={14} />
            <span>Student Safety ({profiles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-[var(--accent)] text-white shadow-sm shadow-purple-500/20'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/80'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Audit History</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('circles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'circles'
                ? 'bg-[var(--accent)] text-white shadow-sm shadow-purple-500/20'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/80'
            }`}
          >
            <Sparkles size={14} />
            <span>Campus Circles</span>
          </button>
        </div>

        {/* TAB 1: FEED MODERATION */}
        {activeTab === 'feed' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E7E5E4]/80 rounded-[16px] p-3.5 shadow-2xs">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                <input
                  type="text"
                  placeholder="Filter moments by caption, category, or location..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-[12px] pl-9 pr-4 py-2 text-xs text-[#1C1917] placeholder-zinc-400 focus:outline-none focus:border-[var(--accent)] focus:bg-white transition-colors"
                />
              </div>
              <p className="text-xs text-[#78716C] font-medium">
                Showing <strong className="text-[#1C1917]">{filteredPosts.length}</strong> moments
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white border border-[#E7E5E4]/80 rounded-[28px] p-4.5 flex flex-col justify-between space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#E7E5E4] transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAFAF8] text-[#78716C]">
                        {post.category || 'MOMENT'}
                      </span>
                      <span className="text-[10px] text-[#A8A29E] font-bold">
                        {formatPostDate(post.created_at)}
                      </span>
                    </div>

                    {post.content && (
                      <p className="text-xs text-[#1C1917] line-clamp-3 leading-relaxed font-medium">
                        {post.content}
                      </p>
                    )}

                    {post.media_urls?.[0] && (
                      <div className="w-full aspect-[16/9] rounded-[16px] overflow-hidden bg-[#FAFAF8] border border-[#E7E5E4]/60 mt-2">
                        <img
                          src={post.media_urls[0]}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E7E5E4]">
                    <span className="text-[10.5px] text-[#78716C] font-semibold">
                      Location: {post.location || 'Campus'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setModeratingPost(post)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Trash2 size={13} />
                      <span>Delete (Host)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 2: STUDENT SAFETY DIRECTORY */}
        {activeTab === 'students' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E7E5E4]/80 rounded-[16px] p-3.5 shadow-2xs">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                <input
                  type="text"
                  placeholder="Search student by name, email, or branch..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-[12px] pl-9 pr-4 py-2 text-xs text-[#1C1917] placeholder-zinc-400 focus:outline-none focus:border-[var(--accent)] focus:bg-white transition-colors"
                />
              </div>
              <p className="text-xs text-[#78716C] font-medium">
                Found <strong className="text-[#1C1917]">{filteredProfiles.length}</strong> students
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProfiles.map((user) => {
                const isBlocked = user.is_blocked || user.status === 'blocked';
                const isSelf = user.id === host.uid;
                const isProtectedAdmin = user.role === 'admin';
                const isProtectedHost = (user.role === 'verified_host' || user.role === 'campus_lead') && host.role !== 'admin';
                const canModerate = !isSelf && !isProtectedAdmin && !isProtectedHost;

                return (
                  <div
                    key={user.id}
                    className="bg-white border border-[#E7E5E4]/80 rounded-[24px] p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:shadow-sm hover:border-[#E7E5E4] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-[16px] overflow-hidden bg-[#FAFAF8] border border-[#E7E5E4]/80 flex-shrink-0">
                        <img
                          src={user.photo_url || getCartoonAvatar(user.full_name || 'Student')}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#1C1917] truncate">
                            {user.full_name || 'Student'}
                          </h4>
                          <HostBadge role={user.role} size="xs" />
                          {isBlocked && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                              Suspended
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-[#78716C] truncate mt-0.5">
                          {user.email} · {user.branch || 'Campus Student'}
                        </p>
                      </div>
                    </div>

                    <div>
                      {canModerate ? (
                        <button
                          type="button"
                          onClick={() => setSuspendingUser(user)}
                          className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            isBlocked
                              ? 'bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200'
                              : 'bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200'
                          }`}
                        >
                          {isBlocked ? 'Reinstate' : 'Suspend'}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#A8A29E] bg-[#FAFAF8] px-2.5 py-1 rounded-lg">
                          <Lock size={10} />
                          <span>Protected</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: AUDIT HISTORY */}
        {activeTab === 'logs' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between bg-white border border-[#E7E5E4]/80 rounded-[16px] p-3.5 shadow-2xs">
              <p className="text-xs text-[#1C1917] font-bold">
                Permanent Campus Moderation Audit Trail
              </p>
              <button
                type="button"
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer font-bold"
              >
                <RefreshCw size={13} className={loadingLogs ? 'animate-spin' : ''} />
                <span>Refresh Logs</span>
              </button>
            </div>

            {loadingLogs ? (
              <div className="py-12 text-center text-[#A8A29E] text-xs font-medium">
                Loading moderation audit history...
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-[#A8A29E] text-xs font-medium bg-white rounded-[16px] border border-[#E7E5E4]/80">
                No moderation actions recorded yet. Your campus is clean!
              </div>
            ) : (
              <div className="bg-white border border-[#E7E5E4]/80 rounded-[24px] divide-y divide-zinc-100 overflow-hidden shadow-2xs">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          log.action_type?.includes('DELETE') || log.action_type?.includes('SUSPEND')
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-[#FAFAF8] text-[#78716C]'
                        }`}>
                          {log.action_type}
                        </span>
                        <span className="text-xs font-bold text-[#1C1917]">
                          Target: {log.metadata?.targetName || log.target_id?.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#78716C] mt-1">
                        Reason: &quot;{log.reason}&quot;
                      </p>
                    </div>

                    <span className="text-[10px] text-[#A8A29E] font-semibold whitespace-nowrap">
                      {formatPostDate(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: CIRCLES & COMMUNITIES */}
        {activeTab === 'circles' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between bg-white border border-[#E7E5E4]/80 rounded-[16px] p-3.5 shadow-2xs">
              <p className="text-xs text-[#1C1917] font-bold">
                Campus Clubs & Student Circles
              </p>
              <Link
                href="/circles"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] bg-[var(--accent)] text-white text-xs font-bold shadow-md shadow-purple-500/20 hover:bg-[var(--accent-hover)] transition-colors"
              >
                <Sparkles size={13} />
                <span>+ Create Instant Circle</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {circles.map((circle) => (
                <div
                  key={circle.id}
                  className="bg-white border border-[#E7E5E4]/80 rounded-[24px] p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-sm transition-shadow"
                >
                  <div>
                    <h4 className="text-sm font-bold text-[#1C1917]">{circle.name}</h4>
                    <p className="text-[11px] text-[#78716C] mt-0.5">
                      {circle.category || 'General'} · {circle.member_count || circle.members_count || 1} members
                    </p>
                  </div>

                  <Link
                    href={`/circles/${circle.id}`}
                    className="p-2 rounded-[12px] bg-[#FAFAF8] hover:bg-[var(--accent-tint-10)] text-[#78716C] transition-colors"
                    title="View Circle"
                  >
                    <ExternalLink size={15} />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* MODAL: DELETE POST CONFIRMATION */}
      {moderatingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-[#E7E5E4] rounded-[32px] p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle size={20} />
                <h3 className="text-base font-bold text-[#1C1917]">Moderate Post</h3>
              </div>
              <button
                type="button"
                onClick={() => setModeratingPost(null)}
                className="text-[#A8A29E] hover:text-[#78716C] p-1 rounded-full hover:bg-[#FAFAF8]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#1C1917]/70 leading-relaxed font-medium">
              As a Verified Campus Host, this post will be immediately removed from the campus feed and logged in the moderation audit trail.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#1C1917] uppercase tracking-wider">
                Select Moderation Reason
              </label>
              <CustomSelect
                value={postDeleteReason}
                onChange={setPostDeleteReason}
                options={[
                  'Spam / Fake Content',
                  'Inappropriate / Adult Media',
                  'Harassment / Abusive Language',
                  'Misleading / Scam',
                  'Other',
                ]}
              />

              {postDeleteReason === 'Other' && (
                <textarea
                  rows={2}
                  placeholder="Explain why this post violates guidelines..."
                  value={customPostReason}
                  onChange={(e) => setCustomPostReason(e.target.value)}
                  className="w-full bg-white border border-[#E7E5E4]/10 rounded-[16px] p-3.5 text-xs font-bold text-[#1C1917] placeholder:text-[#1C1917]/40 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 mt-2 shadow-xs resize-none"
                />
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModeratingPost(null)}
                className="flex-1 py-2.5 rounded-full border border-[#E7E5E4]/10 text-xs font-bold uppercase tracking-wider text-[#1C1917] hover:bg-[var(--accent-tint-10)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePost}
                disabled={isDeletingPost}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-rose-600/25 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingPost ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUSPEND USER CONFIRMATION */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-[#E7E5E4]/10 rounded-[32px] p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <Ban size={20} />
                <h3 className="text-base font-bold text-[#1C1917]">
                  {suspendingUser.is_blocked || suspendingUser.status === 'blocked'
                    ? 'Reinstate Student'
                    : 'Suspend Student Account'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSuspendingUser(null)}
                className="w-8 h-8 rounded-full bg-[var(--accent-tint-10)] text-[#1C1917] flex items-center justify-center hover:bg-[var(--accent-tint-10)] cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#1C1917]/70 leading-relaxed font-medium">
              Target: <strong className="text-[#1C1917] font-bold">{suspendingUser.full_name || 'Student'}</strong> ({suspendingUser.email})
            </p>

            {!(suspendingUser.is_blocked || suspendingUser.status === 'blocked') && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#1C1917] uppercase tracking-wider">
                  Reason for Suspension
                </label>
                <CustomSelect
                  value={suspendReason}
                  onChange={setSuspendReason}
                  options={[
                    'Fake profile / Impersonation',
                    'Spamming campus feeds & chats',
                    'Harassment / Unwanted DMs',
                    'Community guideline violations',
                    'Other',
                  ]}
                />

                {suspendReason === 'Other' && (
                  <textarea
                    rows={2}
                    placeholder="Provide specific details for suspension..."
                    value={customSuspendReason}
                    onChange={(e) => setCustomSuspendReason(e.target.value)}
                    className="w-full bg-white border border-[#E7E5E4]/10 rounded-[16px] p-3.5 text-xs font-bold text-[#1C1917] placeholder:text-[#1C1917]/40 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 mt-2 shadow-xs resize-none"
                  />
                )}
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSuspendingUser(null)}
                className="flex-1 py-2.5 rounded-full border border-[#E7E5E4]/10 text-xs font-bold uppercase tracking-wider text-[#1C1917] hover:bg-[var(--accent-tint-10)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleSuspendUser}
                disabled={isSuspendingUser}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-rose-600/25 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSuspendingUser
                  ? 'Processing...'
                  : (suspendingUser.is_blocked || suspendingUser.status === 'blocked')
                  ? 'Confirm Reinstate'
                  : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
