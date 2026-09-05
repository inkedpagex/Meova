'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, ShieldAlert, GraduationCap, Sparkles, UserCheck, Loader2, Ban, CheckCircle2, Star, Award, Trash2, X, AlertTriangle } from '@/lib/icons';
import CustomSelect from '../../../components/CustomSelect';

const ROLES = [
  { value: 'user', label: 'Student (Normal)', icon: GraduationCap },
  { value: 'verified_host', label: 'Verified Host', icon: Sparkles },
  { value: 'campus_lead', label: 'Campus Lead', icon: UserCheck },
  { value: 'admin', label: 'Administrator', icon: ShieldAlert },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [blockingId, setBlockingId] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/list-users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleRoleChange(uid, newRole) {
    setUpdatingId(uid);
    try {
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid: uid, role: newRole }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update role');
      }
    } catch {
      alert('Network error while updating user role');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleBlock(uid, currentIsBlocked) {
    setBlockingId(uid);
    const targetIsBlocked = !currentIsBlocked;
    try {
      const res = await fetch('/api/admin/toggle-block-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid: uid, isBlocked: targetIsBlocked }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === uid ? {
          ...u,
          isBlocked: targetIsBlocked,
          status: targetIsBlocked ? 'blocked' : 'active'
        } : u));
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update block status');
      }
    } catch {
      alert('Network error while toggling block status');
    } finally {
      setBlockingId(null);
    }
  }

  async function confirmDeleteUser() {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid: deletingUser.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
        setDeletingUser(null);
        alert(data.message || 'User deleted successfully.');
      } else {
        alert(data.error || 'Failed to delete user.');
      }
    } catch {
      alert('Network error while deleting user.');
    } finally {
      setIsDeleting(false);
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.branch || '').toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;

    if (roleFilter === 'blocked') return u.isBlocked || u.status === 'blocked';
    if (roleFilter === 'admin') return u.role === 'admin';
    if (roleFilter === 'verified_host') return u.role === 'verified_host';
    if (roleFilter === 'campus_lead') return u.role === 'campus_lead';
    return true;
  });

  return (
    <div className="anim-fade-in space-y-4 max-w-5xl mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>User & Access Control</span>
            <span className="text-xs font-bold bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)] px-2.5 py-0.5 rounded-full">
              {users.length} Total
            </span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Manage student roles, permissions, and instant account block status.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'blocked', label: 'Blocked' },
            { id: 'admin', label: 'Admins' },
            { id: 'verified_host', label: 'Hosts' },
            { id: 'campus_lead', label: 'Leads' },
          ].map(tab => {
            const isActive = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-xs border border-[var(--accent)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 font-semibold'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Quick search by name, email, or branch..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[var(--accent)] transition-all shadow-xs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md"
          >
            Clear
          </button>
        )}
      </div>

      {/* Compact High-Density Users List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2 shadow-xs">
          <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
          <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Loading campus users...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-xs">
          <p className="text-xs font-bold text-slate-700">No matching users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => {
            const isUserAdmin = u.role === 'admin';
            const isHost = u.role === 'verified_host';
            const isLead = u.role === 'campus_lead';
            const isBlocked = !!(u.isBlocked || u.status === 'blocked');

            let roleBadgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
            let roleLabel = 'Student';

            if (isUserAdmin) {
              roleBadgeBg = 'bg-[var(--accent-tint-10)] text-[var(--accent)] border-[var(--accent-tint-20)] font-bold';
              roleLabel = 'Admin';
            } else if (isHost) {
              roleBadgeBg = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
              roleLabel = 'Verified Host';
            } else if (isLead) {
              roleBadgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
              roleLabel = 'Campus Lead';
            }

            // Clean up year text e.g. "2nd Year" instead of "Year 2nd Year"
            const rawYear = u.year ? String(u.year).replace(/^year\s+/i, '') : '';

            return (
              <div
                key={u.id}
                className={`bg-white border rounded-xl p-3 md:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-2xs hover:border-slate-300 ${
                  isBlocked ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200/90'
                }`}
              >
                {/* Left: Compact Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                    isBlocked ? 'bg-rose-100 text-rose-600 border-rose-200' :
                    isUserAdmin ? 'bg-[var(--accent-tint-10)] text-[var(--accent)] border-[var(--accent-tint-20)]' :
                    isHost ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    isLead ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {isBlocked ? <Ban size={14} /> : isUserAdmin ? <ShieldAlert size={14} /> : isHost ? <Star size={14} /> : isLead ? <Award size={14} /> : <GraduationCap size={14} />}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-bold text-slate-900 truncate">
                        {u.full_name || 'Anonymous Student'}
                      </h3>

                      <span className={`text-[9.5px] uppercase tracking-wider px-1.5 py-0.2 rounded border ${roleBadgeBg}`}>
                        {roleLabel}
                      </span>

                      <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                        <Sparkles size={10} className="fill-current" />
                        {u.sparksBalance || 0} Sparks
                      </span>

                      {isBlocked && (
                        <span className="text-[9.5px] uppercase tracking-wider px-1.5 py-0.2 rounded border bg-rose-100 text-rose-700 border-rose-300 font-extrabold flex items-center gap-0.5">
                          <Ban size={9} /> Blocked
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 truncate flex-wrap">
                      <span className="text-slate-600 font-bold">{u.email}</span>
                      {rawYear && <span>• {rawYear}</span>}
                      {u.branch && <span>• {u.branch}</span>}
                      {u.university && <span>• {u.university}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Controls (Role Select + Block Button) */}
                <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center pt-1 sm:pt-0">
                  
                  {/* Role Selector */}
                  <div className="w-[160px]">
                    <CustomSelect
                      value={u.role || 'user'}
                      disabled={updatingId === u.id}
                      onChange={val => handleRoleChange(u.id, val)}
                      options={ROLES.map(r => ({ value: r.value, label: r.label }))}
                    />
                  </div>

                  {/* Block / Unblock & Delete Actions */}
                  {isUserAdmin || (u.email || '').toLowerCase() === 'chirag2006chak@gmail.com' ? (
                    <span className="text-[10.5px] font-extrabold text-[var(--accent-hover)] bg-[#fcf6fa] px-2.5 py-1.5 rounded-lg border border-[#eac5e0] flex items-center gap-1 select-none">
                      <ShieldAlert size={12} /> Protected Admin
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleBlock(u.id, isBlocked)}
                        disabled={blockingId === u.id}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer shadow-2xs ${
                          isBlocked
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title={isBlocked ? 'Unblock user' : 'Block user'}
                      >
                        {blockingId === u.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : isBlocked ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>Unblock</span>
                          </>
                        ) : (
                          <>
                            <Ban size={12} />
                            <span>Block</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingUser(u)}
                        className="flex items-center gap-1 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                        title="Permanently Delete User & All Data"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DELETE USER CONFIRMATION MODAL ── */}
      {deletingUser && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade-in"
          onClick={() => !isDeleting && setDeletingUser(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 anim-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-100">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Delete User Account?</h3>
                  <p className="text-[11px] font-semibold text-slate-400">Irreversible Action</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => !isDeleting && setDeletingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 text-xs space-y-1 text-rose-900 font-semibold leading-relaxed">
              <p className="font-bold">Are you sure you want to permanently delete this student?</p>
              <p className="text-[11px] text-rose-700">
                • <strong className="font-bold">{deletingUser.full_name || 'Student'}</strong> ({deletingUser.email})
              </p>
              <p className="text-[10.5px] text-rose-600 pt-1">
                All their posts, moments, applications, gigs, reviews, chat history, and wallet records will be permanently purged from database & auth.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteUser}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <><Loader2 size={13} className="animate-spin" /> Purging...</>
                ) : (
                  <><Trash2 size={13} /> Delete Forever</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
