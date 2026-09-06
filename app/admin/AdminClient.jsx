'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, Zap, CreditCard, ArrowUpRight, Calendar,
  ShieldCheck, AlertOctagon, Check, X, RefreshCw, Inbox, ChevronRight,
  Clock, MapPin, CheckCircle, XCircle, Loader2
} from '@/lib/icons';

function fmt(n) {
  return (n || 0).toLocaleString('en-IN');
}

function fmtDate(s) {
  if (!s) return 'Recent';
  try {
    return new Date(s).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return String(s);
  }
}

export default function AdminClient() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    activeEscrow: 0,
    pendingPayments: 0,
    allPaymentsCount: 0,
    pendingWithdrawals: 0,
    allWithdrawalsCount: 0,
    totalUserSparks: 0,
  });

  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [featureFlags, setFeatureFlags] = useState({ gigs: false });
  const [togglingFlag, setTogglingFlag] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  // Filters for sub-lists
  const [bookingFilter, setBookingFilter] = useState('all'); // 'all' | 'pending' | 'confirmed' | 'disputed'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'pending' | 'approved'
  const [withdrawalFilter, setWithdrawalFilter] = useState('all'); // 'all' | 'pending'

  const loadData = useCallback(async () => {
    setFetching(true);
    try {
      const [statsRes, bookingsRes, paymentsRes, withdrawalsRes, disputesRes, flagsRes] = await Promise.all([
        fetch('/api/admin/dashboard-stats'),
        fetch('/api/admin/list-bookings'),
        fetch('/api/admin/list-payments'),
        fetch('/api/admin/list-withdrawals'),
        fetch('/api/admin/list-disputes'),
        fetch('/api/admin/feature-flags'),
      ]);

      if (flagsRes.ok) {
        const fData = await flagsRes.json();
        setFeatureFlags(fData.flags || { gigs: false });
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalUsers: statsData.totalUsers ?? 0,
          totalBookings: statsData.totalBookings ?? 0,
          activeEscrow: statsData.activeEscrow ?? 0,
          pendingPayments: statsData.pendingPayments ?? 0,
          allPaymentsCount: statsData.allPaymentsCount ?? 0,
          pendingWithdrawals: statsData.pendingWithdrawals ?? 0,
          allWithdrawalsCount: statsData.allWithdrawalsCount ?? 0,
          totalUserSparks: statsData.totalUserSparks ?? 0,
        });
      }

      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        setBookings(bData.bookings || []);
      }

      if (paymentsRes.ok) {
        const pData = await paymentsRes.json();
        setPayments(pData.payments || []);
      }

      if (withdrawalsRes.ok) {
        const wData = await withdrawalsRes.json();
        setWithdrawals(wData.withdrawals || []);
      }

      if (disputesRes.ok) {
        const dData = await disputesRes.json();
        setDisputes(dData.disputes || []);
      }
    } catch (err) {
      console.error('[AdminClient] loadData error:', err.message);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Quick Action: Approve / Reject payment
  const handleVerifyPayment = async (requestId, action) => {
    try {
      const res = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, action }),
      });
      if (res.ok) {
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update payment status.');
      }
    } catch {
      alert('Network error');
    }
  };

  // Quick Action: Process withdrawal (Approve or Reject)
  const handleProcessWithdrawal = async (withdrawalId, isApproved) => {
    try {
      const res = await fetch('/api/admin/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          action: isApproved ? 'approve' : 'reject',
          remarks: isApproved ? 'Approved via Admin Quick Actions' : 'Rejected via Admin Quick Actions'
        }),
      });
      if (res.ok) {
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || `Failed to ${isApproved ? 'approve' : 'reject'} withdrawal.`);
      }
    } catch {
      alert('Network error');
    }
  };

  // Quick Action: Resolve dispute
  const handleResolveDispute = async (bookingId, resolution) => {
    try {
      const res = await fetch('/api/admin/resolve-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: resolution }),
      });
      if (res.ok) {
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to resolve dispute.');
      }
    } catch {
      alert('Network error');
    }
  };

  // Toggle feature flags (e.g. Gigs)
  const handleToggleGigs = async () => {
    const nextVal = !featureFlags.gigs;
    setTogglingFlag(true);
    setFeatureFlags(prev => ({ ...prev, gigs: nextVal }));
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureName: 'gigs', enabled: nextVal }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update feature toggle');
        setFeatureFlags(prev => ({ ...prev, gigs: !nextVal }));
      }
    } catch {
      alert('Network error');
      setFeatureFlags(prev => ({ ...prev, gigs: !nextVal }));
    } finally {
      setTogglingFlag(false);
    }
  };

  // Filtered lists
  const filteredBookings = bookingFilter === 'all'
    ? bookings
    : bookings.filter(b => (b.status || '').toLowerCase() === bookingFilter.toLowerCase());

  const filteredPayments = paymentFilter === 'all'
    ? payments
    : payments.filter(p => (p.status || '').toLowerCase() === paymentFilter.toLowerCase());

  const filteredWithdrawals = withdrawalFilter === 'all'
    ? withdrawals
    : withdrawals.filter(w => (w.status || '').toLowerCase() === withdrawalFilter.toLowerCase());

  return (
    <div className="space-y-6 md:space-y-8 anim-fade-in">
      
      {/* ── TOP TITLE & REFRESH BAR ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Meova Control Center
          </h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">
            Live overview of all campus meetings, UPI payments, creator earnings & withdrawals.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={fetching ? 'animate-spin text-[var(--accent)]' : 'text-slate-500'} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── 5 KEY STAT CARDS (INCLUDING TOTAL SPARKS BANK RESERVE) ───── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 md:gap-4">
        
        {/* Card 1: Total Users */}
        <div className="bg-white border border-[var(--accent-tint-20)] rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Total Students
              </span>
              <span className="text-2xl font-bold text-[var(--accent)] mt-1 block">
                {stats.totalUsers}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-tint-10)] flex items-center justify-center text-[var(--accent)]">
              <Users size={16} />
            </div>
          </div>
          <p className="text-[10.5px] font-semibold text-slate-400">Registered platform users</p>
        </div>

        {/* Card 2: Total User Sparks Balance (Bank Reserve) */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-32 bg-gradient-to-br from-amber-50/40 to-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider block">
                Total User Sparks
              </span>
              <span className="text-2xl font-bold text-amber-600 mt-1 flex items-center gap-1">
                <span>{fmt(stats.totalUserSparks)}</span>
                <span className="text-sm">⚡</span>
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-600">
              <Zap size={16} fill="currentColor" />
            </div>
          </div>
          <p className="text-[10.5px] font-bold text-amber-700">Bank Balance across all users</p>
        </div>

        {/* Card 3: Campus Meetings */}
        <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Total Meetings
              </span>
              <span className="text-2xl font-bold text-blue-600 mt-1 block">
                {stats.totalBookings}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar size={16} />
            </div>
          </div>
          <p className="text-[10.5px] font-semibold text-slate-400">
            Escrow: <span className="font-bold text-amber-600">{fmt(stats.activeEscrow)} ⚡</span>
          </p>
        </div>

        {/* Card 4: UPI Payments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-32">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                UPI Payments
              </span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block">
                {stats.allPaymentsCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-[10.5px] font-semibold text-slate-400">
            Pending: <span className="font-bold text-[var(--accent)]">{stats.pendingPayments}</span>
          </p>
        </div>

        {/* Card 5: Withdrawals */}
        <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-32 col-span-2 sm:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Payout Requests
              </span>
              <span className="text-2xl font-bold text-rose-600 mt-1 block">
                {stats.allWithdrawalsCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="text-[10.5px] font-semibold text-slate-400">
            Pending: <span className="font-bold text-rose-600">{stats.pendingWithdrawals}</span>
          </p>
        </div>
      </div>

      {/* ── SECTION: CAMPUS FEATURE LAUNCH CONTROLS ───────────────────── */}
      <div className="bg-gradient-to-r from-[#0D0D0D] via-[#1C1917] to-[#0D0D0D] text-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-md border border-[#E7E5E4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-white">
                Live App Modules & Launch Switches
              </h3>
            </div>
            <p className="text-[11px] text-[#A8A29E] mt-1 font-medium">
              Control feature visibility across the entire student platform in real-time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* Switch 1: Campus Gigs */}
          <div className="bg-[#1C1917]/90 border border-[#E7E5E4] rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Campus Gigs Module</span>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  featureFlags.gigs ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-[#1C1917] text-[#A8A29E] border border-[#E7E5E4]'
                }`}>
                  {featureFlags.gigs ? 'Active on App' : 'Hidden from App'}
                </span>
              </div>
              <p className="text-[10.5px] text-[#A8A29E] leading-relaxed font-medium">
                {featureFlags.gigs
                  ? 'Gigs tab, creation menu, and /gigs are visible to all students.'
                  : 'Gigs tab, buttons, and /gigs routes are 100% hidden from the entire website.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleGigs}
              disabled={togglingFlag}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                featureFlags.gigs ? 'bg-[var(--accent)]' : 'bg-[#2A2A2A]'
              } disabled:opacity-50`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  featureFlags.gigs ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: ALL PAYMENTS & RECHARGES ───────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <CreditCard size={16} />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800">
                All Payments & UPI Recharges ({payments.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Verify student UPI transactions and manual Spark additions.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
              {['all', 'pending'].map(f => (
                <button
                  key={f}
                  onClick={() => setPaymentFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    paymentFilter === f
                      ? 'bg-[var(--accent)] text-white shadow-xs border border-[var(--accent)]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 font-semibold'
                  }`}
                >
                  {f === 'pending' ? `Pending (${stats.pendingPayments})` : 'All'}
                </button>
              ))}
            </div>

            <Link
              href="/admin/payments"
              className="text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all flex items-center gap-1"
            >
              <span>Manage Payments</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl py-8 text-center space-y-1">
            <Inbox size={26} className="text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No payment requests found.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {filteredPayments.map((p) => {
              const isPending = (p.status || '').toLowerCase() === 'pending';
              const isApproved = (p.status || '').toLowerCase() === 'approved';

              return (
                <div
                  key={p.id}
                  className="bg-white border border-[#E7E5E4]/[0.06] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* User Identity */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] text-[var(--accent)] flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {(p.user_name || 'C')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1C1917] truncate">
                            {p.user_name || 'Classmate'}
                          </span>
                          {p.branch && (
                            <span className="text-[10px] font-bold text-[#1C1917]/50 bg-black/5 px-1.5 py-0.2 rounded">
                              {p.branch} {p.year ? `Y${p.year}` : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#1C1917]/60 font-bold truncate">
                          {p.user_email || p.email || 'No email provided'}
                        </p>
                      </div>
                    </div>

                    {/* Pack & Status */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <span className="text-xs font-bold text-[#1C1917]">
                        {p.pack_name || `${p.sparks} Sparks`} — {fmt(p.sparks)} ⚡
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        isPending ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {p.status || 'Pending'}
                      </span>
                    </div>

                    {/* Amount, Ref & Timestamp */}
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-[#1C1917]/60 flex-wrap pt-0.5">
                      <span className="text-emerald-700 font-bold px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                        ₹{Number(p.amount_inr || p.rupees || 0).toFixed(2)}
                      </span>
                      {p.unique_decimal && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--accent-tint-10)] text-[var(--accent)] border border-[var(--accent-tint-20)]">
                          Paise: .{p.unique_decimal}
                        </span>
                      )}
                      {(p.reference_code || p.utr_number) && (
                        <span>Ref/UTR: <code className="font-mono text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{p.reference_code || p.utr_number}</code></span>
                      )}
                      <span className="text-[#1C1917]/40">• {fmtDate(p.created_at)}</span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex gap-2 flex-shrink-0 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleVerifyPayment(p.id, 'approve')}
                        className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[11px] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex-1 sm:flex-none active:scale-95"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleVerifyPayment(p.id, 'reject')}
                        className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold uppercase text-[11px] px-3.5 py-2 rounded-xl transition-all cursor-pointer flex-1 sm:flex-none active:scale-95"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 1: ALL CAMPUS MEETINGS & BOOKINGS ──────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800">
                All Campus Meetings & Bookings ({bookings.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Full log of guest requests, confirmed meets, and escrow state.</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
            {['all', 'requested', 'confirmed', 'completed', 'disputed'].map(f => (
              <button
                key={f}
                onClick={() => setBookingFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  bookingFilter === f
                    ? 'bg-[var(--accent)] text-white shadow-xs border border-[var(--accent)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 font-semibold'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <Loader2 size={20} className="animate-spin text-blue-600" />
            <span className="text-xs font-bold text-slate-400">Loading campus meetings...</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl py-8 text-center space-y-1">
            <Inbox size={26} className="text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No meeting records found for selected filter.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredBookings.map((b) => {
              const statusLower = (b.status || 'requested').toLowerCase();
              let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
              if (statusLower === 'confirmed') badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (statusLower === 'requested') badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
              if (statusLower === 'disputed') badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
              if (statusLower === 'completed') badgeStyle = 'bg-[var(--accent-tint-10)] text-[var(--accent)] border-[var(--accent-tint-20)]';

              return (
                <div
                  key={b.id}
                  className="bg-slate-50/70 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-slate-50"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {b.guestName || b.guest_email || 'Guest'} ➔ {b.hostName || b.host_email || 'Host'}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                        {b.status || 'Requested'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 flex-wrap">
                      {b.location && (
                        <span className="flex items-center gap-1 text-slate-700">
                          <MapPin size={12} className="text-[var(--accent)]" />
                          {b.location}
                        </span>
                      )}
                      {b.timeSlot && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {b.timeSlot}
                        </span>
                      )}
                      <span className="text-amber-600 font-extrabold">{b.price || b.amount || 0} ⚡ Sparks</span>
                      <span className="text-slate-400">• {fmtDate(b.created_at)}</span>
                    </div>
                  </div>

                  {statusLower === 'disputed' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleResolveDispute(b.id, 'refund')}
                        className="bg-rose-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-all cursor-pointer active:scale-95"
                      >
                        Refund Guest
                      </button>
                      <button
                        onClick={() => handleResolveDispute(b.id, 'pay')}
                        className="bg-emerald-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all cursor-pointer active:scale-95"
                      >
                        Pay Host
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 3: ALL PAYOUT & WITHDRAWAL REQUESTS ───────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800">
                All Payout & Withdrawal Requests ({withdrawals.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Review and process Creator Earnings payouts to student UPI / Bank accounts.</p>
            </div>
          </div>

          <Link
            href="/admin/withdrawals"
            className="self-start sm:self-auto text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all flex items-center gap-1"
          >
            <span>Manage Withdrawals</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        {filteredWithdrawals.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl py-8 text-center space-y-1">
            <Inbox size={26} className="text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No payout requests recorded.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {filteredWithdrawals.map((wd) => {
              const isPending = (wd.status || '').toLowerCase() === 'pending';
              const isApproved = (wd.status || '').toLowerCase() === 'approved' || (wd.status || '').toLowerCase() === 'paid';

              return (
                <div
                  key={wd.id}
                  className="bg-slate-50/70 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        ₹{wd.amount_inr || wd.amount} <span className="text-[11px] text-slate-500 font-bold">({wd.sparks_deducted || wd.amount} Sparks)</span>
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        isPending ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {wd.status || 'Pending'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 font-bold">{wd.email || wd.userId}</p>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 flex-wrap">
                      {wd.upi_id && <span>UPI: <code className="font-mono text-slate-800 bg-white border border-slate-200 px-1 rounded">{wd.upi_id}</code></span>}
                      <span className="text-slate-400">• {fmtDate(wd.requested_at || wd.created_at)}</span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleProcessWithdrawal(wd.id, true)}
                        className="bg-emerald-600 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg hover:bg-emerald-700 transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        Approve & Pay
                      </button>
                      <button
                        onClick={() => handleProcessWithdrawal(wd.id, false)}
                        className="bg-white border border-slate-200 text-slate-600 font-bold text-[11px] px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
