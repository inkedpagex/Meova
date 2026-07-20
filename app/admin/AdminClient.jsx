'use client';
import React, { useState, useEffect } from 'react';
import { 
  Users, Zap, Shield, ShieldCheck, Check, X, 
  ArrowUpRight, AlertOctagon, TrendingUp, Clock, CreditCard, RefreshCw 
} from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';

function fmt(n) { return (n || 0).toLocaleString('en-IN'); }

export default function AdminClient() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeEscrow: 0,
    pendingPayments: 0,
    pendingWithdrawals: 0
  });

  const [verifications, setVerifications] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [reports, setReports] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadData();
    }
  }, []);

  const loadData = () => {
    const users = mockDb.getUsers();
    const verifs = mockDb.getHostVerifications();
    const wds = mockDb.getAllWithdrawals();
    const reps = mockDb.getReports();
    const bks = mockDb.getBookings();
    const prs = mockDb.getPaymentRequests();

    // calculate active escrow
    const activeEscrowVal = bks
      .filter(b => ['Requested', 'Confirmed'].includes(b.status))
      .reduce((sum, b) => sum + (b.price || 0), 0);

    setStats({
      totalUsers: users.length,
      activeEscrow: activeEscrowVal,
      pendingPayments: prs.filter(p => p.status === 'pending').length,
      pendingWithdrawals: wds.filter(w => w.status === 'pending').length
    });

    setVerifications(verifs);
    setWithdrawals(wds);
    setReports(reps);
    setBookings(bks);
  };

  const handleApproveHost = (reqId, approve = true) => {
    mockDb.approveHostVerification(reqId, approve);
    loadData();
    alert(`Host verification application ${approve ? 'approved' : 'rejected'} successfully.`);
  };

  const handleProcessWithdrawal = (wdId, approve = true) => {
    const ok = mockDb.processWithdrawal(wdId, approve);
    if (ok) {
      loadData();
      alert(`Withdrawal request ${approve ? 'processed & paid — user notified' : 'declined and sparks refunded'}.`);
    } else {
      alert('Failed to process. Withdrawal may already be handled.');
    }
  };

  return (
    <div className="space-y-8 anim-fade-in pb-16">
      
      {/* ── METRICS OVERVIEW ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers, color: 'text-blue-400', icon: Users },
          { label: 'Escrow Holdings', value: `${fmt(stats.activeEscrow)} ⚡`, color: 'text-yellow-400', icon: Zap },
          { label: 'Host Requests', value: stats.pendingPayments, color: 'text-orange-400', icon: Shield },
          { label: 'Pending Payouts', value: stats.pendingWithdrawals, color: 'text-rose-400', icon: ArrowUpRight }
        ].map((s) => (
          <div key={s.label} className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col justify-between h-24">
            <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">{s.label}</span>
            <div className="flex items-end justify-between">
              <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
              <s.icon size={16} className="text-[var(--text-muted)] mb-1" />
            </div>
          </div>
        ))}
      </div>

      {/* ── HOST VERIFICATION REQUESTS ────────────────────────────── */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
            Manual Host Verifications ({verifications.filter(v => v.status === 'pending').length})
          </h3>
          <button onClick={loadData} className="p-1 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white transition-all">
            <RefreshCw size={12} />
          </button>
        </div>

        {verifications.filter(v => v.status === 'pending').length === 0 ? (
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase text-center py-3">No pending host applications</p>
        ) : (
          <div className="space-y-3">
            {verifications.filter(v => v.status === 'pending').map((req) => (
              <div key={req.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-white">{req.userName}</h4>
                  <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-wider">
                    {req.email} • {req.university}
                  </p>
                  <p className="text-[10px] text-indigo-400 font-black mt-1.5 uppercase tracking-wide">
                    Enrollment ID: {req.govId || 'None Provided'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveHost(req.id, true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check size={12} />
                    <span>Approve Host</span>
                  </button>
                  <button
                    onClick={() => handleApproveHost(req.id, false)}
                    className="bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 hover:border-transparent font-black uppercase text-[9px] px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <X size={12} />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PENDING WITHDRAWALS ───────────────────────────────────── */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 md:p-6 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
          Pending Withdrawals ({withdrawals.filter(w => w.status === 'pending').length})
        </h3>

        {withdrawals.filter(w => w.status === 'pending').length === 0 ? (
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase text-center py-3">No pending payout requests</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.filter(w => w.status === 'pending').map((wd) => (
              <div key={wd.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-white">{fmt(wd.amount)} Sparks (ES)</h4>
                  <p className="text-[9.5px] text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-wider">
                    Method: {wd.method} • Host ID: {wd.userId}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1.5 leading-normal bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg">
                    Payment Details: {wd.details}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleProcessWithdrawal(wd.id, true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] px-4.5 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => handleProcessWithdrawal(wd.id, false)}
                    className="bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 hover:border-transparent font-black uppercase text-[9px] px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SAFETY REPORTS ────────────────────────────────────────── */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-5 md:p-6 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2 flex items-center gap-1.5">
          <AlertOctagon size={14} className="text-rose-500 animate-pulse" />
          <span>Flagged Campus Reports ({reports.length})</span>
        </h3>

        {reports.length === 0 ? (
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase text-center py-3">No user reports filed</p>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div key={rep.id} className="bg-rose-500/5 border border-rose-500/15 p-4 rounded-2xl flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between border-b border-rose-500/10 pb-1.5">
                  <span className="text-[9px] font-black text-rose-400 uppercase">Reported ID: {rep.reportedId}</span>
                  <span className="text-[9px] text-[var(--text-muted)] uppercase">By: {rep.reporterId}</span>
                </div>
                <p className="text-[10.5px] text-[var(--text-secondary)] font-semibold leading-relaxed">
                  Reason: "{rep.reason}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
