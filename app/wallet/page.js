'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, Zap, Plus, HelpCircle, Circle } from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';

export default function WalletPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [balance, setBalance] = useState(1250);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(250);
  const [addSuccess, setAddSuccess] = useState('');
  const packs = [100, 250, 500, 1000];

  const [transactions, setTransactions] = useState([
    { id: 'tx1', title: 'Joined Coffee Connect', date: 'May 20, 2026 · 5:02 PM', amount: -150, type: 'spend' },
    { id: 'tx2', title: 'Added to wallet', date: 'May 18, 2026 · 1:15 PM', amount: 250, type: 'add' },
    { id: 'tx3', title: 'Joined Photography Walk', date: 'May 17, 2026 · 4:30 PM', amount: -200, type: 'spend' },
    { id: 'tx4', title: 'Event Refund (Movie Night)', date: 'May 15, 2026 · 9:10 PM', amount: 150, type: 'refund' },
  ]);

  const loadWallet = (uid) => {
    const w = mockDb.getWallet(uid);
    if (w) {
      const total = (w.purchased || 0) + (w.bonus || 0) + (w.creator || 0);
      setBalance(total > 0 ? total : 1250);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        const uid = data?.user?.id || data?.user?.uid || 'local';
        setUserId(uid);
        loadWallet(uid);
      } catch { /* use defaults */ }
      setLoading(false);
    };
    init();
    const onUpdate = () => { if (userId) loadWallet(userId); };
    window.addEventListener('wallet-updated', onUpdate);
    return () => window.removeEventListener('wallet-updated', onUpdate);
  }, [userId]);

  const handleAddSparks = () => {
    if (!userId) { alert('Please log in first'); return; }
    const w = mockDb.getWallet(userId) || { purchased: 0, bonus: 0, creator: 0 };
    w.purchased += selectedPack;
    mockDb.saveWallet(userId, w);
    const now = new Date();
    const fmt = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setTransactions(prev => [{ id: 'tx-' + Date.now(), title: 'Added to wallet', date: fmt, amount: selectedPack, type: 'add' }, ...prev]);
    setBalance(prev => prev + selectedPack);
    window.dispatchEvent(new Event('wallet-updated'));
    setAddSuccess(`${selectedPack} Sparks added successfully!`);
    setTimeout(() => setAddSuccess(''), 3000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-4 max-w-[500px] mx-auto pb-24 anim-fade-in" style={{ background: 'var(--bg-base)' }}>

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
        <button className="p-2 rounded-xl border cursor-pointer" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <Info size={15} />
        </button>
      </div>

      {/* Success toast */}
      {addSuccess && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-xs font-bold text-emerald-700 anim-fade-up"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          {addSuccess}
        </div>
      )}

      {/* Hero Balance Card */}
      <div className="relative rounded-3xl p-6 mb-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2" style={{ background: 'white' }} />
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 block mb-1">Your Balance</span>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black text-white tracking-tight">{balance.toLocaleString()}</span>
            <Zap size={24} className="text-orange-400 fill-current" />
          </div>
          <span className="text-[9px] text-white/50 font-semibold mt-1 block">1 Spark = ₹1</span>
          <div className="flex gap-3 mt-5">
            <button onClick={handleAddSparks}
              className="flex-1 bg-white text-zinc-900 font-black text-[11px] uppercase tracking-wider py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all shadow-md">
              Add Sparks
            </button>
            <button className="flex-1 text-white font-black text-[11px] uppercase tracking-wider py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
              History
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="mb-5">
        <span className="text-[10px] font-black uppercase tracking-widest block mb-3" style={{ color: 'var(--text-muted)' }}>Quick Add</span>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {packs.map(p => (
            <button key={p} onClick={() => setSelectedPack(p)}
              className="py-3.5 rounded-2xl flex flex-col items-center cursor-pointer transition-all active:scale-95"
              style={{
                background: selectedPack === p ? 'rgba(124,58,237,0.08)' : 'var(--bg-elevated)',
                border: selectedPack === p ? '2px solid #7c3aed' : '1px solid var(--border-subtle)',
                color: selectedPack === p ? '#7c3aed' : 'var(--text-primary)',
              }}>
              <span className="text-sm font-black">{p}</span>
              <span className="text-[8px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>₹{p}</span>
            </button>
          ))}
        </div>
        <button onClick={handleAddSparks}
          className="w-full py-4 rounded-2xl text-white font-black text-[12px] uppercase tracking-wider cursor-pointer active:scale-[0.98] transition-all shadow-md"
          style={{ background: '#7c3aed' }}>
          Add {selectedPack} Sparks · ₹{selectedPack}
        </button>
      </div>

      {/* Transactions */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Recent Transactions</span>
          <button className="text-[10px] font-bold text-[#7c3aed] cursor-pointer">See all</button>
        </div>
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.id} className="p-4 rounded-2xl flex items-center justify-between gap-3 transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: tx.amount > 0 ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface)',
                    border: tx.amount > 0 ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-subtle)',
                    color: tx.amount > 0 ? '#10b981' : 'var(--text-muted)',
                  }}>
                  {tx.amount > 0 ? <Plus size={14} strokeWidth={3} /> : <Zap size={14} className="opacity-50" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{tx.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{tx.date}</p>
                </div>
              </div>
              <span className="text-[12px] font-black flex-shrink-0" style={{ color: tx.amount > 0 ? '#10b981' : 'var(--text-primary)' }}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* How Sparks Work */}
      <div className="rounded-3xl p-5" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.12)' }}>
        <h4 className="text-xs font-black uppercase tracking-wider text-[#7c3aed] flex items-center gap-1.5 mb-3">
          <HelpCircle size={14} /> How Sparks work?
        </h4>
        <ul className="space-y-2.5">
          {[
            'Use Sparks to join experiences, events and tournaments.',
            'Earn Sparks by joining, creating and being active.',
            '1 Spark = ₹1',
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] mt-1.5 flex-shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
