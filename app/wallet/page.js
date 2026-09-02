'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, Zap, Plus, HelpCircle, Loader2, CheckCircle, Download, Copy, Check, X } from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import { toast } from '../../lib/toast';

function WalletSkeleton() {
  return (
    <div className="min-h-screen px-4 py-4 max-w-[500px] mx-auto pb-24 anim-fade-in animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
          <Skeleton variant="text" className="w-32 h-4" />
        </div>
        <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
      </div>

      {/* Hero Balance Card */}
      <Skeleton variant="rectangular" className="w-full h-[220px] rounded-3xl mb-5" />

      {/* Quick Add */}
      <div className="mb-5">
        <Skeleton variant="text" className="w-24 h-3 mb-3" />
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rectangular" className="h-[60px] rounded-2xl" />)}
        </div>
        <Skeleton variant="rectangular" className="w-full h-12 rounded-2xl" />
      </div>

      {/* Transactions */}
      <div>
        <Skeleton variant="text" className="w-32 h-3 mb-3 mt-8" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-2xl">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="w-10 h-10" />
                <div>
                  <Skeleton variant="text" className="w-24 h-3 mb-1" />
                  <Skeleton variant="text" className="w-16 h-2" />
                </div>
              </div>
              <Skeleton variant="text" className="w-12 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PACKS = [
  { sparks: 100,  inr: 100,  key: 'pack_100' },
  { sparks: 250,  inr: 250,  key: 'pack_250' },
  { sparks: 500,  inr: 500,  key: 'pack_500' },
  { sparks: 1000, inr: 1000, key: 'pack_1000' },
];



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
  const [requestLoading, setRequestLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [intentId, setIntentId] = useState(null);
  const [exactAmountInr, setExactAmountInr] = useState(0);
  const [intentLoading, setIntentLoading] = useState(false);

  const balance = wallet
    ? (wallet.purchased || 0) + (wallet.bonus || 0) + (wallet.creator || 0)
    : 0;

  const loadWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet');
      if (!res.ok) return;
      const data = await res.json();
      if (data.wallet) setWallet(data.wallet);
      if (data.transactions) setTransactions(data.transactions);
      if (data.pendingRequests) setPendingRequests(data.pendingRequests);
    } catch (err) {
      console.error('[WalletPage] load error:', err);
    } finally {
      await new Promise(r => setTimeout(r, 300));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWallet();
    const onUpdate = () => loadWallet();
    window.addEventListener('wallet-updated', onUpdate);
    return () => window.removeEventListener('wallet-updated', onUpdate);
  }, [loadWallet]);

  const openPaymentModal = (pack = selectedPack) => {
    if (pendingRequests.length >= 3) {
      toast.error('Limit reached: You already have 3 pending payment verification requests.');
      return;
    }
    setSelectedPack(pack);
    setExactAmountInr(pack.inr);
    setIsModalOpen(true);
    setIntentLoading(true);
    
    fetch('/api/wallet/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sparks: pack.sparks,
        amount_inr: pack.inr,
        pack_name: `${pack.sparks} Sparks`,
        pack_key: pack.key
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.intentId && data.amount_inr) {
          setIntentId(data.intentId);
          setExactAmountInr(data.amount_inr);
        }
      })
      .catch((err) => {
        console.warn('[WalletIntent] fallback to standard pack price:', err);
      })
      .finally(() => {
        setIntentLoading(false);
      });
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const downloadQRCode = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`upi://pay?pa=chirag2006chak@oksbi&pn=Meova&am=${exactAmountInr}&cu=INR`)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Meova-payment-₹${exactAmountInr}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`upi://pay?pa=chirag2006chak@oksbi&pn=Meova&am=${exactAmountInr}&cu=INR`)}`;
      window.open(qrUrl, '_blank');
    }
  };

  const submitPaymentRequest = async () => {
    if (requestLoading) return;
    setRequestLoading(true);
    try {
      let res;
      if (intentId) {
        res = await fetch('/api/wallet/intent', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intentId }),
        });
      } else {
        res = await fetch('/api/wallet/request-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sparks: selectedPack.sparks,
            amount_inr: exactAmountInr,
            pack_name: `${selectedPack.sparks} Sparks`,
            pack_key: selectedPack.key,
          }),
        });
      }
      const data = await res.json();
      if (res.ok) {
        toast.success(`Payment request submitted for ₹${exactAmountInr}. Verification in progress.`);
        loadWallet();
        setIsModalOpen(false);
      } else {
        toast.error(data.error || 'Something went wrong. Try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const cancelRequest = async (id) => {
    try {
      const res = await fetch('/api/wallet/intent', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId: id }),
      });
      if (res.ok) {
        toast.success('Request cancelled successfully.');
        loadWallet();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to cancel request.');
      }
    } catch {
      toast.error('Network error while cancelling.');
    }
  };

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
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 cursor-pointer transition-all active:scale-95 shadow-2xs"
            title="Back"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <h1 className="text-sm font-black uppercase tracking-wider text-zinc-950">Sparks Wallet</h1>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed anim-fade-up bg-emerald-50 border border-emerald-200 text-emerald-800">
          {toast}
        </div>
      )}

      {/* Hero Balance Card */}
      <div className="relative rounded-3xl p-6 mb-5 overflow-hidden bg-gradient-to-br from-[#FF6B1A] via-[#F05A00] to-[#D94F00] shadow-xl shadow-orange-500/20 text-white">
        <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-100 block mb-1">Your Balance</span>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black text-white tracking-tight">{balance.toLocaleString()}</span>
            <Zap size={24} className="text-amber-300 fill-amber-300" />
          </div>
          <span className="text-[10px] text-orange-100 font-semibold mt-1 block">1 Spark = ₹1</span>

          {/* Breakdown */}
          {wallet && (
            <div className="flex gap-4 mt-3.5 pt-3.5 border-t border-white/20">
              {[
                { label: 'Purchased', val: wallet.purchased || 0 },
                { label: 'Bonus',     val: wallet.bonus || 0 },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-[9px] uppercase tracking-wider text-orange-200 font-bold">{label}</p>
                  <p className="text-sm font-black text-white">{val}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button onClick={() => openPaymentModal(selectedPack)} disabled={intentLoading}
              className="flex-1 bg-white hover:bg-orange-50 text-zinc-950 font-black text-[11px] uppercase tracking-wider py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
              {intentLoading ? <Loader2 size={14} className="animate-spin" /> : 'Add Sparks'}
            </button>
            <button onClick={() => router.push('/wallet/withdraw')}
              className="flex-1 bg-white/15 hover:bg-white/25 border border-white/25 text-white font-black text-[11px] uppercase tracking-wider py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all">
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Lifetime Metrics */}
      {wallet && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#F05A00] mb-1">Lifetime Earned</span>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black text-zinc-900">{wallet.lifetime_earned || 0}</span>
              <Zap size={14} className="fill-[#F05A00] text-[#F05A00]" />
            </div>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">Total Withdrawn</span>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black text-zinc-900">{wallet.lifetime_withdrawn || 0}</span>
              <Zap size={14} className="fill-zinc-400 text-zinc-400" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Add */}
      <div className="mb-5">
        <span className="text-[10px] font-black uppercase tracking-widest block mb-3" style={{ color: 'var(--text-muted)' }}>Quick Add</span>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PACKS.map(p => (
            <button key={p.key} onClick={() => setSelectedPack(p)}
              className="py-3.5 rounded-2xl flex flex-col items-center cursor-pointer transition-all active:scale-95"
              style={{
                background: selectedPack.key === p.key ? 'rgba(140,53,115,0.08)' : 'var(--bg-elevated)',
                border: selectedPack.key === p.key ? '2px solid #F05A00' : '1px solid var(--border-subtle)',
                color: selectedPack.key === p.key ? '#F05A00' : 'var(--text-primary)',
              }}>
              <span className="text-sm font-black">{p.sparks}</span>
              <span className="text-[8px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>₹{p.inr}</span>
            </button>
          ))}
        </div>
        <button onClick={() => openPaymentModal(selectedPack)} disabled={intentLoading}
          className="w-full py-4 rounded-2xl text-white font-black text-[12px] uppercase tracking-wider cursor-pointer active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-80"
          style={{ background: '#F05A00' }}>
          {intentLoading ? <Loader2 size={16} className="animate-spin" /> : `Add ${selectedPack.sparks} Sparks · ₹${selectedPack.inr}`}
        </button>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#d97706]">Pending Verification</span>
          </div>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-4 rounded-2xl flex items-center justify-between gap-3 bg-[#fffbeb] border border-[#fde68a]">
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[#b45309]">
                    {req.pack_name}
                  </p>
                  <p className="text-[10px] text-[#d97706] mt-0.5 font-medium flex items-center gap-1.5">
                    Requested: <strong className="font-black">₹{req.amount_inr}</strong>
                    <span>·</span>
                    <Loader2 size={10} className="animate-spin inline" />
                    Reviewing
                  </p>
                </div>
                <button 
                  onClick={() => cancelRequest(req.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#fef3c7] transition-colors flex-shrink-0 cursor-pointer text-[#d97706]"
                  title="Cancel Request"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Recent Transactions</span>
        </div>
        {transactions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-zinc-400 font-semibold">No transactions yet</p>
            <p className="text-[10px] text-zinc-300 mt-1">Your activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const isRejected = tx.requestStatus === 'rejected';
              const isPending = tx.requestStatus === 'pending';
              const isCancelled = tx.requestStatus === 'cancelled';
              const isPositive = tx.amount > 0 && !isRejected && !isPending && !isCancelled;
              
              let bgColor = isPositive ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface)';
              let borderColor = isPositive ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-subtle)';
              let iconColor = isPositive ? '#10b981' : 'var(--text-muted)';
              let amountColor = isPositive ? '#10b981' : 'var(--text-primary)';
              
              if (isRejected) {
                bgColor = 'rgba(239,68,68,0.1)';
                borderColor = '1px solid rgba(239,68,68,0.3)';
                iconColor = '#ef4444';
                amountColor = '#ef4444';
              } else if (isPending) {
                bgColor = 'rgba(245,158,11,0.1)';
                borderColor = '1px solid rgba(245,158,11,0.3)';
                iconColor = '#f59e0b';
                amountColor = '#f59e0b';
              } else if (isCancelled) {
                bgColor = 'rgba(161,161,170,0.1)';
                borderColor = '1px solid rgba(161,161,170,0.3)';
                iconColor = '#a1a1aa';
                amountColor = '#a1a1aa';
              }

              return (
                <div key={tx.id} className="p-4 rounded-2xl flex items-center justify-between gap-3 transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: bgColor, border: borderColor, color: iconColor }}>
                      {isPositive ? <Plus size={14} strokeWidth={3} /> : <Zap size={14} className="opacity-50" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {tx.description || tx.title || 'Transaction'}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[12px] font-black block" style={{ color: amountColor }}>
                      {isPositive ? '+' : ''}{tx.amount}
                    </span>
                    {(isRejected || isPending || isCancelled) && (
                      <span className="text-[9px] font-bold uppercase tracking-wider block mt-0.5" style={{ color: iconColor }}>
                        {tx.requestStatus}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How Sparks Work */}
      <div className="rounded-2xl p-5 bg-orange-50/40 border border-orange-100">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#F05A00] flex items-center gap-1.5 mb-3">
          <HelpCircle size={14} /> How Sparks work?
        </h4>
        <ul className="space-y-2.5">
          {[
            'Use Sparks to book campus meets, join circles, and fund gigs.',
            'Earn Sparks by hosting and participating.',
            '1 Spark = ₹1 · Minimum withdrawal: 500 Sparks',
            'Sparks never expire.',
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F05A00] mt-1.5 flex-shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* QR Code Payment Modal */}
      {isModalOpen && (
        <div 
          onClick={closeModal}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md anim-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-[370px] overflow-hidden shadow-2xl relative cursor-default border border-zinc-100 anim-scale-in"
          >
            <div className="p-6 text-center">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-black text-zinc-900">Add Sparks via UPI</h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-zinc-500 font-medium mb-1">
                Pay the <strong className="text-[#D94F00]">exact amount</strong> below
              </p>
              <p className="text-3xl font-black text-zinc-950 tracking-tight mb-4">
                ₹{exactAmountInr}
              </p>
              
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex flex-col items-center justify-center mb-4">
                <div className="w-[180px] h-[180px] bg-white p-2 rounded-xl shadow-xs border border-zinc-200/80 flex items-center justify-center mb-3">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=chirag2006chak@oksbi&pn=Meova&am=${exactAmountInr}&cu=INR`)}`} 
                    alt="UPI QR Code" 
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex items-center gap-2 w-full">
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('chirag2006chak@oksbi');
                      toast.success('UPI ID copied to clipboard');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-black text-zinc-700 bg-white hover:bg-zinc-100 py-2 rounded-xl transition-all cursor-pointer border border-zinc-200 shadow-2xs"
                  >
                    <Copy size={12} />
                    <span>Copy UPI ID</span>
                  </button>
                  <button 
                    type="button"
                    onClick={downloadQRCode}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-black text-[#F05A00] bg-orange-50 hover:bg-orange-100 py-2 rounded-xl transition-all cursor-pointer border border-orange-200"
                  >
                    <Download size={12} />
                    <span>Save QR</span>
                  </button>
                </div>
              </div>

              <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3 mb-5 text-left flex items-start gap-2">
                <Info size={14} className="text-[#F05A00] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#D94F00] font-bold leading-relaxed">
                  Pay with Google Pay, PhonePe, or Paytm, then tap "I have paid" below.
                </p>
              </div>

              <div className="flex gap-2.5">
                <button 
                  type="button"
                  onClick={closeModal} 
                  disabled={requestLoading}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={submitPaymentRequest} 
                  disabled={requestLoading}
                  className="flex-1 py-3 rounded-2xl font-black text-xs text-white bg-[#F05A00] hover:bg-[#D94F00] transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 cursor-pointer disabled:opacity-60"
                >
                  {requestLoading ? <Loader2 size={14} className="animate-spin" /> : 'I have paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
