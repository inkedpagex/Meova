'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Zap, CreditCard, ArrowUpRight, Calendar,
  ShieldCheck, AlertOctagon, Check, X, RefreshCw, Inbox, ChevronRight
} from 'lucide-react';
// mockDb removed

function fmt(n) {
  return (n || 0).toLocaleString('en-IN');
}

export default function AdminClient() {
  const [stats, setStats] = useState({
    totalUsers: 101,
    activeEscrow: 100,
    pendingPayments: 0,
    pendingWithdrawals: 0,
  });

  const [verifications, setVerifications] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/admin/dashboard-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalUsers: statsData.totalUsers ?? 101,
          activeEscrow: statsData.activeEscrow ?? 100,
          pendingPayments: statsData.pendingPayments ?? 0,
          pendingWithdrawals: statsData.pendingWithdrawals ?? 0,
        });
      }

      const withdrawalsRes = await fetch('/api/admin/list-withdrawals');
      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json();
        setWithdrawals(withdrawalsData.withdrawals || []);
      }

      const verifs = []; // mockDb.getHostVerifications();
      setVerifications(verifs);
      
      const disputesRes = await fetch('/api/admin/list-disputes');
      if (disputesRes.ok) {
        const disputesData = await disputesRes.json();
        setDisputes(disputesData.disputes || []);
      }
    } catch (err) {
      console.error('[AdminClient] loadData error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveHost = (reqId, approve = true) => {
    // API Call goes here for approve/reject host
    alert(`Host verification application ${approve ? 'approved' : 'rejected'} successfully.`);
    loadData();
  };

  const handleProcessWithdrawal = async (wdId, approve = true) => {
    try {
      const res = await fetch('/api/admin/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: wdId,
          action: approve ? 'approve' : 'reject',
          remarks: 'Processed via admin dashboard',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        loadData();
        alert(`Withdrawal request ${approve ? 'processed & paid' : 'declined'}.`);
      } else {
        alert(data.error || 'Failed to process.');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleResolveDispute = async (bookingId, action) => {
    try {
      const res = await fetch('/api/admin/resolve-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        loadData();
        alert(`Dispute resolved. Action: ${action === 'refund' ? 'Guest Refunded' : 'Host Paid'}`);
      } else {
        alert(data.error || 'Failed to resolve dispute.');
      }
    } catch {
      alert('Network error');
    }
  };

  const pendingVerifs = verifications.filter(v => v.status === 'pending');
  const pendingWds = withdrawals.filter(w => w.status === 'pending');
  const activeDisputes = disputes.filter(d => d.status === 'Disputed');

  return (
    <div className="space-y-6 md:space-y-8 anim-fade-in">
      
      {/* ── TOP TITLE & DATE FILTER ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">
            Manage verification records, escrow details, and withdraw payouts.
          </p>
        </div>

        <button className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
          <Calendar size={14} className="text-slate-400" />
          <span>May 18 – May 24, 2024</span>
          <span className="text-[10px] text-slate-400">▼</span>
        </button>
      </div>

      {/* ── 4 STAT CARDS GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-5">
        
        {/* Card 1: Total Users */}
        <div className="bg-white border border-purple-100/80 rounded-2xl p-4 md:p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-32 md:h-36">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] md:text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Total Users
              </span>
              <span className="text-2xl md:text-3xl font-black text-[#7c3aed] mt-1 block">
                {stats.totalUsers}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#7c3aed]">
              <Users size={18} />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-400">
            <span className="hidden sm:inline">All registered users</span>
            <span className="sm:hidden">All users</span>
          </p>
        </div>

        {/* Card 2: Escrow Holdings */}
        <div className="bg-white border border-amber-100/80 rounded-2xl p-4 md:p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-32 md:h-36">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] md:text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Escrow Holdings
              </span>
              <span className="text-2xl md:text-3xl font-black text-amber-500 mt-1 block">
                {fmt(stats.activeEscrow)}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Zap size={18} />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-400">
            In Sparks
          </p>
        </div>

        {/* Card 3: Pending Recharges */}
        <div className="bg-white border border-orange-100/80 rounded-2xl p-4 md:p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-32 md:h-36">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] md:text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Pending Recharges
              </span>
              <span className="text-2xl md:text-3xl font-black text-orange-500 mt-1 block">
                {stats.pendingPayments}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
              <CreditCard size={18} />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-400">
            Awaiting payment
          </p>
        </div>

        {/* Card 4: Pending Payouts */}
        <div className="bg-white border border-rose-100/80 rounded-2xl p-4 md:p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-32 md:h-36">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] md:text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block">
                Pending Payouts
              </span>
              <span className="text-2xl md:text-3xl font-black text-rose-500 mt-1 block">
                {stats.pendingWithdrawals}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-400">
            Awaiting approval
          </p>
        </div>

      </div>

      {/* ── 3 MANAGEMENT SECTIONS ────────────────────────────────────── */}
      <div className="space-y-4 md:space-y-6">
        
        {/* SECTION 1: Manual Host Verifications */}
        <div className="bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7c3aed]">
                <ShieldCheck size={16} />
              </div>
              <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-800">
                Manual Host Verifications ({pendingVerifs.length})
              </h3>
            </div>
            <Link
              href="/admin?tab=verifs"
              className="text-[11px] font-extrabold px-3 py-1.5 rounded-lg bg-purple-50 text-[#7c3aed] hover:bg-purple-100 transition-all flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={12} className="md:hidden" />
            </Link>
          </div>

          {pendingVerifs.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center justify-center text-center">
              <Inbox size={28} className="text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-400">No pending host applications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVerifs.map((req) => (
                <div key={req.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{req.userName}</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{req.email} • {req.university}</p>
                    <p className="text-[11px] text-[#7c3aed] font-bold mt-1">ID: {req.govId || 'Pending'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveHost(req.id, true)}
                      className="bg-[#7c3aed] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-purple-700 transition-all"
                    >
                      Approve Host
                    </button>
                    <button
                      onClick={() => handleApproveHost(req.id, false)}
                      className="bg-white border border-slate-200 text-slate-600 font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Pending Withdrawals */}
        <div className="bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ArrowUpRight size={16} />
              </div>
              <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-800">
                Pending Withdrawals ({pendingWds.length})
              </h3>
            </div>
            <Link
              href="/admin/withdrawals"
              className="text-[11px] font-extrabold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={12} className="md:hidden" />
            </Link>
          </div>

          {pendingWds.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center justify-center text-center">
              <Inbox size={28} className="text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-400">No pending payout requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingWds.map((wd) => (
                <div key={wd.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">₹{wd.amount_inr} ({wd.sparks_deducted} Sparks)</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">UPI ID: {wd.upi_id}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Requested by User ID: {wd.userId}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProcessWithdrawal(wd.id, true)}
                      className="bg-emerald-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-emerald-700 transition-all"
                    >
                      Approve & Pay
                    </button>
                    <button
                      onClick={() => handleProcessWithdrawal(wd.id, false)}
                      className="bg-white border border-slate-200 text-slate-600 font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: Escrow Disputes */}
        <div className="bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                <AlertOctagon size={16} />
              </div>
              <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-800">
                Escrow Disputes ({activeDisputes.length})
              </h3>
            </div>
          </div>

          {activeDisputes.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center justify-center text-center">
              <Inbox size={28} className="text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-400">No active booking disputes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDisputes.map((dispute) => (
                <div key={dispute.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Guest: {dispute.guestName} vs Host: {dispute.hostName}
                    </h4>
                    <p className="text-[10px] text-slate-500">Booking ID: {dispute.id}</p>
                    <p className="text-[11px] font-semibold text-slate-600 mt-1">Amount in Escrow: {dispute.amount || 50} Sparks</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveDispute(dispute.id, 'refund')}
                      className="bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-rose-100 transition-all"
                    >
                      Refund Guest
                    </button>
                    <button
                      onClick={() => handleResolveDispute(dispute.id, 'pay')}
                      className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-all"
                    >
                      Pay Host
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
