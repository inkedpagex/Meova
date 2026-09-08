'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Shield, TrendingUp, AlertTriangle, Lock, ChevronRight, Zap } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="bg-white border border-black/10 rounded-[26px] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-black">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-black">{value ?? '—'}</p>
      <p className="text-sm text-black/60 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-black/40 mt-1">{sub}</p>}
    </div>
  );
}

function UserRow({ user, ambassadorTier, isAdmin, onConfirm, onBlock, onFlag }) {
  const [loading, setLoading] = useState('');

  const handle = async (action) => {
    setLoading(action);
    await action();
    setLoading('');
  };

  const canModerate = isAdmin || ambassadorTier === 'full';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-black/5 last:border-0">
      <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {user.photo_url
          ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-black font-bold text-sm">{(user.full_name || 'U')[0]}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-black text-sm truncate">{user.full_name || 'Unknown'}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.tier === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-black/5 text-black/50'}`}>
            {user.tier === 'verified' ? 'Verified' : 'Unverified'}
          </span>
          {user.college_confirmed && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
              College Confirmed
            </span>
          )}
          {user.is_blocked && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
              Blocked
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!user.college_confirmed && (
          <button
            onClick={() => onConfirm(user.id)}
            disabled={loading === 'confirm'}
            className="text-xs font-semibold text-[#1C1917] border border-[#E7E5E4] px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 hover:bg-black/5 transition-colors disabled:opacity-50"
          >
            Confirm
          </button>
        )}
        {canModerate && (
          <button
            onClick={() => onBlock(user.id, !user.is_blocked)}
            disabled={loading === 'block'}
            className="text-xs font-semibold text-black/50 border border-black/10 px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 hover:bg-black/5 transition-colors disabled:opacity-50"
          >
            {user.is_blocked ? 'Unblock' : 'Block'}
          </button>
        )}
        <button
          onClick={() => onFlag(user.id)}
          className="text-xs text-black/30 hover:text-black/60 transition-colors"
          title="Flag for review"
        >
          <AlertTriangle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AmbassadorDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [ambassadorTier, setAmbassadorTier] = useState('none');
  const [isAdmin, setIsAdmin] = useState(false);
  const [collegeName, setCollegeName] = useState('');
  const [colleges, setColleges] = useState([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterUnconfirmed, setFilterUnconfirmed] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadDashboard = useCallback(async (cId = '') => {
    try {
      const url = cId ? `/api/ambassador/dashboard?college_id=${cId}` : '/api/ambassador/dashboard';
      const res = await fetch(url);
      if (res.status === 403) {
        setError('Ambassador access required. Apply at /ambassador to join the program.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setAmbassadorTier(data.ambassadorTier || 'none');
      setIsAdmin(Boolean(data.isAdmin));
      if (data.college?.name) setCollegeName(data.college.name);

      // If admin, load all colleges list for the switcher
      if (data.isAdmin) {
        fetch('/api/colleges')
          .then(r => r.json())
          .then(d => {
            if (d.colleges?.length) {
              setColleges(d.colleges);
              if (!cId && d.colleges[0]?.id) {
                setSelectedCollegeId(d.colleges[0].id);
                setCollegeName(d.colleges[0].name);
              }
            }
          })
          .catch(() => {});
      }
    } catch {
      setError('Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (cId = '') => {
    const activeCollege = cId || selectedCollegeId;
    const url = activeCollege
      ? `/api/ambassador/college-users?page=${page}&unconfirmed=${filterUnconfirmed}&college_id=${activeCollege}`
      : `/api/ambassador/college-users?page=${page}&unconfirmed=${filterUnconfirmed}`;

    const res = await fetch(url);
    const data = await res.json();
    setUsers(prev => page === 1 ? (data.users || []) : [...prev, ...(data.users || [])]);
    setHasMore(data.hasMore || false);
  }, [page, filterUnconfirmed, selectedCollegeId]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { if (!loading && !error) loadUsers(selectedCollegeId); }, [loadUsers, loading, error, selectedCollegeId]);

  const handleCollegeChange = (id) => {
    setSelectedCollegeId(id);
    setPage(1);
    const col = colleges.find(c => c.id === id);
    if (col) setCollegeName(col.name);
    loadDashboard(id);
    loadUsers(id);
  };

  const handleConfirm = async (userId) => {
    const res = await fetch('/api/ambassador/confirm-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: userId }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'User confirmed!');
      setUsers(u => u.map(u2 => u2.id === userId ? { ...u2, college_confirmed: true } : u2));
      loadDashboard(selectedCollegeId);
    } else {
      showToast(data.error || 'Failed to confirm');
    }
  };

  const handleBlock = async (userId, shouldBlock) => {
    const res = await fetch('/api/ambassador/block-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: userId, action: shouldBlock ? 'block' : 'unblock' }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Done');
      setUsers(u => u.map(u2 => u2.id === userId ? { ...u2, is_blocked: shouldBlock } : u2));
    } else {
      showToast(data.error || 'Failed');
    }
  };

  const handleFlag = async (userId) => {
    const reason = window.prompt('Reason for flagging this user (required):');
    if (!reason || reason.trim().length < 10) return;
    const res = await fetch('/api/ambassador/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_id: userId, target_type: 'user', reason }),
    });
    const data = await res.json();
    showToast(data.ok ? 'Flagged for admin review.' : (data.error || 'Failed to flag'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#7657D9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !isAdmin) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-xl font-bold text-black mb-2">Ambassador Access Required</h1>
        <p className="text-black/60 text-sm mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => router.push('/ambassador')}
          className="bg-[#7657D9] hover:bg-[#6848C9] active:bg-[#5B3FB3] text-white font-bold px-8 py-3 rounded-full whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer"
        >
          Apply to Become an Ambassador
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white font-inter">
      {/* Header */}
      <div className="bg-black px-6 pt-12 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            {isAdmin ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#7657D9] text-white">
                Super Admin Access
              </span>
            ) : (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${ambassadorTier === 'full' ? 'bg-[#7657D9] text-white' : 'bg-[#F1EEFB] text-[#7657D9] border border-[#D9D1F2]'}`}>
                {ambassadorTier === 'full' ? 'Full Ambassador' : 'Probation Ambassador'}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">Ambassador Dashboard</h1>
          <p className="text-white/50 text-sm mt-1">
            {collegeName ? `Campus: ${collegeName}` : 'Your campus activity overview'}
          </p>

          {/* Super Admin College Switcher */}
          {isAdmin && colleges.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10 max-w-sm">
              <p className="text-xs text-white/60 mb-1.5 font-medium">Switch Campus to Inspect / Moderate:</p>
              <CustomSelect
                options={colleges.map(c => ({ value: c.id, label: `${c.name}${c.city ? ` (${c.city})` : ''}` }))}
                value={selectedCollegeId}
                onChange={handleCollegeChange}
                placeholder="Choose college to view..."
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Students" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} />
            <StatCard label="Verified" value={stats.verifiedUsers} icon={<CheckCircle className="w-5 h-5" />} />
            <StatCard label="College Confirmed" value={stats.confirmedUsers} icon={<Shield className="w-5 h-5" />} />
            <StatCard label="New This Week" value={stats.newSignups7d} icon={<TrendingUp className="w-5 h-5" />} sub="Last 7 days" />
          </div>
        )}

        {/* Tier 2 badge for non-admin probation ambassadors */}
        {!isAdmin && ambassadorTier !== 'full' && (
          <div className="border border-[#E7E5E4] bg-[#FAFAF8] rounded-[22px] px-5 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-black text-sm">Probation Period Active</p>
              <p className="text-black/50 text-xs mt-0.5">Block and content removal tools unlock after probation. Keep confirming users and maintaining community standards.</p>
            </div>
          </div>
        )}

        {/* Users list */}
        <div className="bg-white border border-black/10 rounded-[26px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
            <h2 className="font-bold text-black">
              {collegeName ? `${collegeName} Students` : 'College Students'}
            </h2>
            <button
              onClick={() => { setFilterUnconfirmed(f => !f); setPage(1); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer ${filterUnconfirmed ? 'bg-[#7657D9] text-white' : 'border border-black/15 text-black/60'}`}
            >
              {filterUnconfirmed ? 'Showing Unconfirmed' : 'Filter: Unconfirmed'}
            </button>
          </div>

          <div className="px-5 divide-y divide-transparent">
            {users.length === 0 ? (
              <p className="py-8 text-center text-black/40 text-sm">No students found for this campus.</p>
            ) : (
              users.map(u => (
                <UserRow
                  key={u.id}
                  user={u}
                  ambassadorTier={ambassadorTier}
                  isAdmin={isAdmin}
                  onConfirm={handleConfirm}
                  onBlock={handleBlock}
                  onFlag={handleFlag}
                />
              ))
            )}
          </div>

          {hasMore && (
            <div className="px-5 pb-4">
              <button
                onClick={() => setPage(p => p + 1)}
                className="w-full border border-black/10 rounded-[14px] py-3 text-sm font-semibold text-black/60 hover:bg-black/5 transition-colors flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
              >
                Load more <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </main>
  );
}
