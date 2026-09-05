'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Info, Zap, Plus, HelpCircle, Loader2, CheckCircle,
  Download, Copy, Check, X, Clock, AlertCircle, RefreshCw, ShieldCheck
} from '@/lib/icons';
import Skeleton from '../../components/Skeleton';
import { toast } from '../../lib/toast';
import StoryCampaignBanner from '../../components/StoryCampaignBanner';

function WalletSkeleton() {
  return (
    <div className="min-h-screen px-4 pt-[68px] md:pt-6 max-w-[500px] mx-auto pb-24 anim-fade-in animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
          <Skeleton variant="text" className="w-32 h-4" />
        </div>
        <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
      </div>
      <Skeleton variant="rectangular" className="w-full h-[220px] rounded-[16px] mb-5" />
      <div className="mb-5">
        <Skeleton variant="text" className="w-24 h-3 mb-3" />
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rectangular" className="h-[60px] rounded-[16px]" />)}
        </div>
        <Skeleton variant="rectangular" className="w-full h-12 rounded-[16px]" />
      </div>
    </div>
  );
}

// 1:1 Sparks-to-INR Packages (1 Spark = ₹1)
const PACKS = [
  { sparks: 100,  inr: 100,  label: 'Starter',  key: 'starter', popular: false },
  { sparks: 250,  inr: 250,  label: 'Popular',  key: 'popular', popular: true },
  { sparks: 500,  inr: 500,  label: 'Growth',   key: 'growth',  popular: false },
  { sparks: 1000, inr: 1000, label: 'Pro (Max)', key: 'pro',     popular: false },
];

const ADMIN_UPI = 'chirag2006chak@oksbi';

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  } catch { return iso; }
}

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(PACKS[1]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeReservation, setActiveReservation] = useState(null);

  // Modal & Reservation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReservation, setCurrentReservation] = useState(null);
  const [resLoading, setResLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const timerRef = useRef(null);

  const balance = wallet ? (wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0) : 0;

  const loadWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet');
      if (!res.ok) return;
      const data = await res.json();
      if (data.wallet) setWallet(data.wallet);
      if (data.transactions) setTransactions(data.transactions);
      if (data.pendingRequests) setPendingRequests(data.pendingRequests);
      if (data.activeReservation) setActiveReservation(data.activeReservation);
    } catch (err) {
      console.error('[WalletPage] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
    const onUpdate = () => loadWallet();
    window.addEventListener('wallet-updated', onUpdate);
    const interval = setInterval(loadWallet, 15000);
    return () => {
      window.removeEventListener('wallet-updated', onUpdate);
      clearInterval(interval);
    };
  }, [loadWallet]);

  // Countdown timer handler for modal
  useEffect(() => {
    if (!isModalOpen || !currentReservation || currentReservation.status === 'paid_claimed') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const expTime = currentReservation.expires_at ? new Date(currentReservation.expires_at).getTime() : Date.now() + 300000;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        toast.error('Reservation window expired. Please create a new request.');
        setCurrentReservation(prev => prev ? { ...prev, status: 'expired' } : null);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [isModalOpen, currentReservation]);

  const openPaymentModal = async (pack = selectedPack) => {
    setSelectedPack(pack);
    setIsModalOpen(true);
    setResLoading(true);

    try {
      const res = await fetch('/api/wallet/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packKey: pack.key,
          sparks: pack.sparks,
          baseAmount: pack.inr,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reservation) {
        setCurrentReservation(data.reservation);
        setTimeLeft(data.reservation.seconds_remaining || 300);
      } else if (data.activeReservation) {
        setCurrentReservation(data.activeReservation);
        setTimeLeft(data.activeReservation.seconds_remaining || 300);
        toast('Resuming your active reservation.');
      } else {
        toast.error(data.error || 'Failed to create reservation slot');
        setIsModalOpen(false);
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      setIsModalOpen(false);
    } finally {
      setResLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleClaimPaid = async () => {
    if (!currentReservation?.id || claimLoading) return;
    setClaimLoading(true);
    try {
      const res = await fetch('/api/wallet/reservation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: currentReservation.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Payment claim registered! Admin will verify against UPI statement.');
        setCurrentReservation(prev => ({ ...prev, status: 'paid_claimed' }));
        loadWallet();
      } else {
        toast.error(data.error || 'Failed to claim payment.');
      }
    } catch {
      toast.error('Network error while claiming.');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!currentReservation?.id) return;
    try {
      await fetch('/api/wallet/reservation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: currentReservation.id }),
      });
      toast.success('Reservation cancelled.');
      setIsModalOpen(false);
      setCurrentReservation(null);
      loadWallet();
    } catch {
      toast.error('Failed to cancel.');
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const payAmount = currentReservation ? Number(currentReservation.final_amount || currentReservation.amount_inr || selectedPack.inr) : selectedPack.inr;
  const refCode = currentReservation?.reference_code || `SPK-${selectedPack.sparks}`;
  const qrData = `upi://pay?pa=${ADMIN_UPI}&pn=Meova&am=${payAmount.toFixed(2)}&tn=${refCode}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

  if (loading) return <WalletSkeleton />;

  return (
    <div className="min-h-screen px-4 pt-[68px] md:pt-6 max-w-[500px] mx-auto pb-24 anim-fade-in relative">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) router.back();
            else router.push('/');
          }}
            className="p-2 rounded-xl bg-white border border-[#E7E5E4] text-[#1C1917] hover:bg-[#FAFAF8] cursor-pointer transition-all active:scale-95 shadow-2xs"
            title="Back"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <h1 className="text-sm font-bold uppercase tracking-wider text-[#1C1917]">Sparks Wallet</h1>
        </div>

        <button onClick={loadWallet} className="p-2 rounded-xl bg-white border border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] transition-all cursor-pointer shadow-2xs" title="Refresh Wallet">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Instagram Story Campaign Banner */}
      <StoryCampaignBanner className="mb-5" />

      {/* Active Claim / Reviewing Banner */}
      {pendingRequests.filter(r => r.status === 'paid_claimed').map(r => (
        <div key={r.id} className="mb-5 p-4 rounded-[16px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 shadow-xs anim-scale-in">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
              <Clock size={14} className="animate-spin text-amber-600" />
              <span>Payment Claimed · Admin Verifying</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-0.5 font-medium truncate">
              {r.pack_name || `${r.sparks} Sparks`} · Amount: <strong className="font-bold">₹{r.final_amount || r.amount_inr}</strong>
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 border border-amber-500/30 flex-shrink-0">
            In Review
          </span>
        </div>
      ))}

      {/* Hero Balance Card (Derived Ledger Source) */}
      <div className="relative rounded-[20px] p-6 mb-5 bg-white border border-[#E7E5E4] shadow-[0_2px_8px_rgba(28,25,23,0.06)] text-[#1C1917]">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#78716C]">Your Balance</span>
            <span className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] px-2.5 py-0.5 rounded-full">
              1 Spark = ₹1
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-4xl font-bold text-[#1C1917] tracking-tight">{balance.toLocaleString()}</span>
            <Zap size={24} className="text-[var(--accent)] fill-[var(--accent)]" />
          </div>

          {/* Breakdown */}
          {wallet && (
            <div className="flex gap-6 mt-4 pt-4 border-t border-[#E7E5E4]">
              {[
                { label: 'Purchased', val: wallet.purchased || 0 },
                { label: 'Bonus',     val: wallet.bonus || 0 },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-wider text-[#78716C] font-bold">{label}</p>
                  <p className="text-sm font-bold text-[#1C1917]">{val} ⚡</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button onClick={() => openPaymentModal(selectedPack)}
              className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-full cursor-pointer active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2">
              <Plus size={15} strokeWidth={2.5} />
              <span>Add Sparks</span>
            </button>
            <button onClick={() => router.push('/wallet/withdraw')}
              className="flex-1 bg-white hover:bg-[var(--accent-tint-10)] text-[#1C1917] border border-[#E7E5E4] font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-full cursor-pointer active:scale-95 transition-all shadow-xs">
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add (1:1 Ratio: 100 = ₹100, 250 = ₹250, 500 = ₹500, 1000 = ₹1000) */}
      <div className="mb-5">
        <span className="text-[10px] font-bold uppercase tracking-widest block mb-3 text-[#78716C]">Select Sparks Pack (1:1 Rate)</span>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PACKS.map(p => (
            <button key={p.key} onClick={() => setSelectedPack(p)}
              className="py-3.5 rounded-[16px] flex flex-col items-center cursor-pointer transition-all active:scale-95 relative"
              style={{
                background: selectedPack.key === p.key ? 'var(--accent-tint-10)' : '#FFFFFF',
                border: selectedPack.key === p.key ? '2px solid var(--accent)' : '1px solid var(--border-hairline)',
                color: selectedPack.key === p.key ? 'var(--accent)' : '#1C1917',
              }}>
              {p.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                  Popular
                </span>
              )}
              <span className="text-sm font-bold">{p.sparks}</span>
              <span className="text-[10px] font-bold mt-0.5 text-[#78716C]">₹{p.inr}</span>
            </button>
          ))}
        </div>
        <button onClick={() => openPaymentModal(selectedPack)}
          className="w-full py-4 rounded-full text-white font-bold text-[13px] uppercase tracking-wider cursor-pointer active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)]">
          <span>Recharge {selectedPack.sparks} Sparks · ₹{selectedPack.inr}</span>
        </button>
      </div>

      {/* Double-Entry Ledger Transactions */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#78716C]">Ledger Activity</span>
          <span className="text-[10px] text-[#78716C] font-semibold flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>Secure Ledger</span>
          </span>
        </div>
        {transactions.length === 0 ? (
          <div className="py-8 text-center bg-white border border-[#E7E5E4] rounded-[16px]">
            <p className="text-xs text-[#78716C] font-semibold">No transactions yet</p>
            <p className="text-[10px] text-[#A8A29E] mt-1">Your ledger activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const isPositive = tx.amount > 0 && tx.requestStatus !== 'rejected' && tx.requestStatus !== 'cancelled';
              const isPending = tx.requestStatus === 'pending' || tx.requestStatus === 'paid_claimed';
              const isRejected = tx.requestStatus === 'rejected';

              return (
                <div key={tx.id} className="p-4 rounded-[16px] flex items-center justify-between gap-3 bg-white border border-[#E7E5E4] shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      isRejected ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                      isPending ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-[#FAFAF8] text-[#78716C] border border-[#E7E5E4]'
                    }`}>
                      {isPositive ? <Plus size={14} strokeWidth={3} /> : <Zap size={14} className="opacity-60" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold truncate text-[#1C1917]">
                        {tx.description || tx.title || 'Transaction'}
                      </p>
                      <p className="text-[10px] mt-0.5 text-[#78716C]">
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-[12px] font-bold block ${
                      isPositive ? 'text-emerald-600' :
                      isRejected ? 'text-rose-600 line-through' :
                      isPending ? 'text-amber-600' :
                      'text-[#1C1917]'
                    }`}>
                      {isPositive ? '+' : ''}{tx.amount} ⚡
                    </span>
                    {tx.requestStatus && (
                      <span className="text-[9px] font-bold uppercase tracking-wider block mt-0.5 text-amber-600">
                        {tx.requestStatus === 'paid_claimed' ? 'In Review' : tx.requestStatus}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decimal Matching Payment Modal */}
      {isModalOpen && (
        <div 
          onClick={closeModal}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md anim-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] w-full max-w-[390px] overflow-hidden shadow-2xl relative cursor-default border border-[#E7E5E4] anim-scale-in"
          >
            {resLoading ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
                <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Allocating Unique Decimal Slot...</p>
              </div>
            ) : currentReservation?.status === 'paid_claimed' ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#1C1917]">Payment Claim Registered!</h3>
                <p className="text-xs text-[#78716C] font-medium leading-relaxed">
                  We have received your claim for <strong className="text-[#1C1917]">₹{payAmount.toFixed(2)}</strong> ({selectedPack.sparks} Sparks). An admin is verifying your payment against the UPI statement.
                </p>
                <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E7E5E4] text-xs font-mono font-bold text-[#1C1917]">
                  Ref: {refCode}
                </div>
                <button
                  onClick={closeModal}
                  className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            ) : currentReservation?.status === 'expired' ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-xs">
                  <AlertCircle size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#1C1917]">Reservation Expired</h3>
                <p className="text-xs text-[#78716C] font-medium leading-relaxed">
                  The 5-minute reservation window for this decimal amount has expired. Please create a fresh reservation.
                </p>
                <button
                  onClick={() => openPaymentModal(selectedPack)}
                  className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all cursor-pointer shadow-xs"
                >
                  Create New Reservation
                </button>
              </div>
            ) : (
              <div className="p-6 text-center">
                {/* Header & 5-Minute Timer */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                    <span>UPI Decimal Payment</span>
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                    timeLeft < 60 ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <Clock size={12} />
                    <span>{formatTimer(timeLeft)}</span>
                  </div>
                </div>

                {/* Exact Decimal Amount */}
                <p className="text-xs text-[#78716C] font-semibold mb-0.5">Pay EXACT Amount</p>
                <p className="text-3xl font-bold text-[#1C1917] tracking-tight mb-1">
                  ₹{payAmount.toFixed(2)}
                </p>
                <p className="text-[10.5px] font-bold text-[var(--accent)] mb-4">
                  (Includes unique paise key for instant automated verification)
                </p>

                {/* QR Code */}
                <div className="bg-[#FAFAF8] p-4 rounded-[20px] border border-[#E7E5E4] flex flex-col items-center justify-center mb-4">
                  <div className="w-[170px] h-[170px] bg-white p-2 rounded-xl shadow-xs border border-[#E7E5E4] flex items-center justify-center mb-3">
                    <img src={qrUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                  </div>

                  <div className="flex items-center gap-2 w-full">
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ADMIN_UPI);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                        toast.success('UPI ID copied to clipboard');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#1C1917] bg-white hover:bg-[#F5F5F4] py-2 rounded-xl transition-all cursor-pointer border border-[#E7E5E4] shadow-2xs"
                    >
                      {copiedUpi ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(refCode);
                        setCopiedRef(true);
                        setTimeout(() => setCopiedRef(false), 2000);
                        toast.success('Reference code copied');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-[var(--accent)] bg-[var(--accent-tint-10)] hover:bg-[var(--accent-tint-20)] py-2 rounded-xl transition-all cursor-pointer border border-[var(--accent-tint-20)]"
                    >
                      {copiedRef ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>Ref: {refCode}</span>
                    </button>
                  </div>
                </div>

                {/* Warning note */}
                <div className="bg-[var(--accent-tint-10)] border border-[var(--accent-tint-20)] rounded-[14px] p-2.5 mb-4 text-left flex items-start gap-2">
                  <Info size={14} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-[var(--accent-hover)] font-bold leading-relaxed">
                    Pay exact ₹{payAmount.toFixed(2)} with any UPI app, then tap "I have paid" below before the timer runs out.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5">
                  <button 
                    type="button"
                    onClick={handleCancelReservation}
                    className="flex-1 py-3 rounded-full font-bold text-xs text-[#78716C] bg-white hover:bg-[#F5F5F4] border border-[#E7E5E4] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleClaimPaid}
                    disabled={claimLoading || timeLeft <= 0}
                    className="flex-1 py-3 rounded-full font-bold text-xs uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {claimLoading ? <Loader2 size={14} className="animate-spin" /> : 'I Have Paid'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
