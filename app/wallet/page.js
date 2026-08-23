'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, Zap, Plus, HelpCircle, Loader2, CheckCircle, Download, Copy, Check, X } from 'lucide-react';
import Skeleton from '../../components/Skeleton';

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

  const openPaymentModal = async (pack = selectedPack) => {
    if (pendingRequests.length >= 3) {
      setToast('⚠️ You have reached the limit of 3 pending payment requests. Please wait for verification.');
      return;
    }
    setSelectedPack(pack);
    setIntentLoading(true);
    
    try {
      const res = await fetch('/api/wallet/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sparks: pack.sparks,
          amount_inr: pack.inr > 1 ? pack.inr - 1 : pack.inr,
          pack_name: `${pack.sparks} Sparks`,
          pack_key: pack.key
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIntentId(data.intentId);
        setExactAmountInr(data.amount_inr);
        setIsModalOpen(true);
      } else {
        setToast(data.error || 'Failed to generate payment intent');
      }
    } catch (err) {
      setToast('Network error');
    } finally {
      setIntentLoading(false);
    }
  };

  const closeModal = async () => {
    setIsModalOpen(false);
  };

  const downloadQRCode = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`upi://pay?pa=chirag2006chak@oksbi&pn=Meetuply&am=${exactAmountInr}&cu=INR`)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `meetuply-payment-₹${exactAmountInr}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`upi://pay?pa=chirag2006chak@oksbi&pn=Meetuply&am=${exactAmountInr}&cu=INR`)}`;
      window.open(qrUrl, '_blank');
    }
  };

  const submitPaymentRequest = async () => {
    if (requestLoading) return; // Guard against double-clicks
    setRequestLoading(true);
    try {
      const res = await fetch('/api/wallet/intent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast(`✅ Payment request submitted for ₹${exactAmountInr}! We will verify it shortly.`);
        loadWallet(); // Reload to show in pending requests
        setIsModalOpen(false);
      } else {
        setToast(data.error || 'Something went wrong. Try again.');
      }
    } catch {
      setToast('Network error. Please try again.');
    } finally {
      setRequestLoading(false);
      setTimeout(() => setToast(''), 6000);
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
        setToast('✅ Request cancelled successfully.');
        loadWallet();
      } else {
        const data = await res.json();
        setToast(data.error || 'Failed to cancel request.');
      }
    } catch (err) {
      setToast('Network error while cancelling.');
    } finally {
      setTimeout(() => setToast(''), 4000);
    }
  };

  if (loading) return <WalletSkeleton />;

  return (
    <div className="min-h-screen px-4 py-4 max-w-[500px] mx-auto pb-24 anim-fade-in relative" style={{ background: 'var(--bg-base)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl border cursor-pointer transition-all active:scale-95"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <h1 className="text-[13px] font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Sparks Wallet</h1>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed anim-fade-up"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#065f46' }}>
          {toast}
        </div>
      )}

      {/* Hero Balance Card */}
      <div className="relative rounded-3xl p-6 mb-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #8C3573, #8C3573)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2" style={{ background: 'white' }} />
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 block mb-1">Your Balance</span>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black text-white tracking-tight">{balance.toLocaleString()}</span>
            <Zap size={24} className="text-orange-400 fill-current" />
          </div>
          <span className="text-[9px] text-white/50 font-semibold mt-1 block">1 Spark = ₹1</span>

          {/* Breakdown */}
          {wallet && (
            <div className="flex gap-4 mt-3">
              {[
                { label: 'Purchased', val: wallet.purchased || 0 },
                { label: 'Bonus',     val: wallet.bonus || 0 },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-[8px] uppercase tracking-wider text-white/40 font-bold">{label}</p>
                  <p className="text-[13px] font-black text-white">{val}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button onClick={() => openPaymentModal(selectedPack)} disabled={intentLoading}
              className="flex-1 bg-white text-zinc-900 font-black text-[11px] uppercase tracking-wider py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
              {intentLoading ? <Loader2 size={14} className="animate-spin" /> : 'Add Sparks'}
            </button>
            <button onClick={() => router.push('/wallet/withdraw')}
              className="flex-1 text-white font-black text-[11px] uppercase tracking-wider py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Lifetime Metrics */}
      {wallet && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="bg-[#fcf6fa] border border-[#eac5e0] rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#8C3573] mb-1">Lifetime Earned</span>
            <span className="text-xl font-black text-[#5e214d]">{wallet.lifetime_earned || 0} <span className="text-sm">⚡</span></span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Total Withdrawn</span>
            <span className="text-xl font-black text-slate-700">{wallet.lifetime_withdrawn || 0} <span className="text-sm">⚡</span></span>
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
                border: selectedPack.key === p.key ? '2px solid #8C3573' : '1px solid var(--border-subtle)',
                color: selectedPack.key === p.key ? '#8C3573' : 'var(--text-primary)',
              }}>
              <span className="text-sm font-black">{p.sparks}</span>
              <span className="text-[8px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>₹{p.inr}</span>
            </button>
          ))}
        </div>
        <button onClick={() => openPaymentModal(selectedPack)} disabled={intentLoading}
          className="w-full py-4 rounded-2xl text-white font-black text-[12px] uppercase tracking-wider cursor-pointer active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-80"
          style={{ background: '#8C3573' }}>
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
      <div className="rounded-3xl p-5" style={{ background: 'rgba(140,53,115,0.05)', border: '1px solid rgba(140,53,115,0.12)' }}>
        <h4 className="text-xs font-black uppercase tracking-wider text-[#8C3573] flex items-center gap-1.5 mb-3">
          <HelpCircle size={14} /> How Sparks work?
        </h4>
        <ul className="space-y-2.5">
          {[
            'Use Sparks to join experiences, events and tournaments.',
            'Earn Sparks by hosting and participating.',
            '1 Spark = ₹1 · Minimum withdrawal: 500 Sparks',
            'Sparks never expire.',
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#8C3573] mt-1.5 flex-shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* QR Code Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm anim-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl relative">
            <div className="p-6 text-center">
              <h2 className="text-lg font-black text-zinc-900 mb-1">Pay with UPI</h2>
              <p className="text-[13px] text-zinc-600 font-medium mb-1">Please pay the <b className="text-[#74295d]">exact amount</b> below</p>
              <p className="text-[26px] font-black text-zinc-900 tracking-tight mb-6">₹{exactAmountInr}</p>
              
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex flex-col items-center justify-center mb-6">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=chirag2006chak@oksbi&pn=Meetuply&am=${exactAmountInr}&cu=INR`)}`} 
                  alt="UPI QR Code" 
                  className="w-[180px] h-[180px] rounded-lg mb-3"
                />
                <button 
                  onClick={downloadQRCode}
                  className="flex items-center gap-1.5 text-[11px] font-black text-[#74295d] bg-[#fcf6fa] hover:bg-[#f5ebf4] px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
                >
                  <Download size={12} />
                  Download QR Image
                </button>
              </div>

              <div className="bg-[#fcf6fa] border border-[#f5ebf4] rounded-2xl p-4 mb-6 text-left">
                <p className="text-[11px] text-[#74295d] font-bold leading-relaxed">
                  Please pay the exact amount shown above to verify your payment automatically.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={closeModal} disabled={requestLoading}
                  className="flex-1 py-3.5 rounded-xl font-bold text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-all">
                  Cancel
                </button>
                <button onClick={submitPaymentRequest} disabled={requestLoading}
                  className="flex-1 py-3.5 rounded-xl font-black text-xs text-white bg-[#8C3573] hover:bg-[#74295d] transition-all flex items-center justify-center gap-2">
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
