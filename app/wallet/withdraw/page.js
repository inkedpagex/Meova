'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { mockDb } from '../../../lib/mockDatabase';

export default function WithdrawPage() {
  const [amount, setAmount]           = useState('');
  const [method, setMethod]           = useState('upi');
  const [upiId, setUpiId]             = useState('');
  const [bankDetails, setBankDetails] = useState({
    account_name: '', account_number: '', bank_name: '', ifsc_code: '',
  });
  const [wallet, setWallet]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState('form'); // 'form' | 'success'
  const [userId, setUserId]   = useState(null);
  const [error, setError]     = useState('');
  const [hasPendingWd, setHasPendingWd] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        const uid = d?.user?.id || d?.user?.uid;
        if (!uid) return;
        setUserId(uid);
        const w = mockDb.getWallet(uid);
        setWallet(w);
        const wds = mockDb.getWithdrawals(uid);
        setHasPendingWd(wds.some(w => w.status === 'pending'));
      })
      .catch(() => {});
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const amt = parseInt(amount, 10);

    if (isNaN(amt) || amt < 1000) {
      setError('Minimum withdrawal is 1,000 Creator Sparks.');
      return;
    }
    if (!wallet || (wallet.creator || 0) < amt) {
      setError('Insufficient Creator Earnings balance.');
      return;
    }
    if (hasPendingWd) {
      setError('You already have a pending withdrawal. Please wait for it to be processed.');
      return;
    }
    if (method === 'upi' && !upiId.trim()) {
      setError('Please enter your UPI ID.');
      return;
    }
    if (method === 'bank' && (!bankDetails.account_name || !bankDetails.account_number || !bankDetails.ifsc_code)) {
      setError('Please fill in all bank account details.');
      return;
    }

    setLoading(true);
    try {
      const details = method === 'upi'
        ? upiId
        : `${bankDetails.account_name} · ${bankDetails.bank_name} · A/C ${bankDetails.account_number} · IFSC ${bankDetails.ifsc_code}`;

      const result = mockDb.createWithdrawal(userId, amt, method, details);

      if (!result) {
        setError('Failed to process withdrawal. Please try again.');
        setLoading(false);
        return;
      }

      // Refresh local wallet display
      setWallet(mockDb.getWallet(userId));
      setHasPendingWd(true);
      window.dispatchEvent(new Event('wallet-updated'));
      setStep('success');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const creatorBalance = wallet?.creator || 0;

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }} className="anim-fade-in px-4 pb-12">
      <Link href="/wallet" className="inline-flex items-center gap-2 text-xs font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all mb-8 uppercase tracking-wider">
        <ArrowLeft size={14} /> Back to Wallet
      </Link>

      {step === 'form' && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
              Withdraw Earnings
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, fontWeight: '600' }}>
              Cash out your Creator Earnings to UPI or bank.
            </p>
            <p style={{ fontSize: 13, marginTop: 4, fontWeight: 800 }}>
              Available: <span style={{ color: '#22c55e' }}>{(creatorBalance || 0).toLocaleString()} ⚡ Creator Sparks</span>
            </p>
          </div>

          {/* Already pending */}
          {hasPendingWd && (
            <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl mb-6 flex items-start gap-3">
              <Clock size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p style={{ fontSize: 13, color: '#fbbf24', fontWeight: 800 }}>Withdrawal Pending</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: '600' }}>
                  You have a pending withdrawal being processed by admin. Please wait for it to complete before submitting a new one.
                </p>
              </div>
            </div>
          )}

          {creatorBalance < 1000 ? (
            <div className="bg-[var(--bg-elevated)] border border-red-500/20 p-5 rounded-2xl mb-6 shadow-sm">
              <p style={{ fontSize: 13, color: '#f87171', fontWeight: 800 }}>
                ⚠️ You need at least 1,000 Creator Sparks to withdraw.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: '600' }}>
                Host premium workshops, coffee sessions, and gigs to accumulate Creator Earnings.
              </p>
            </div>
          ) : !hasPendingWd && (
            <>
              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-red-400">{error}</p>
                </div>
              )}

              {/* Amount */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Amount (Creator Sparks)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" min="1000" max={creatorBalance}
                    placeholder="1000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                  />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 800, color: 'var(--text-muted)' }}>
                    ⚡
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontWeight: '700' }}>
                  1 Spark ≈ ₹1. Sparks deducted immediately. Minimum: 1,000.
                </p>
              </div>

              {/* Method selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Payout Method
                </label>
                <div className="flex gap-3">
                  {['upi', 'bank'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`flex-1 py-3 rounded-xl text-center border font-black text-xs transition-all active:scale-95 cursor-pointer ${
                        method === m
                          ? 'border-[var(--accent)] bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-mid)]'
                      }`}
                    >
                      {m === 'upi' ? 'UPI Transfer' : 'Bank Account'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method details */}
              {method === 'upi' ? (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Your UPI ID
                  </label>
                  <input
                    type="text" placeholder="username@upi"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    required={method === 'upi'}
                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'account_name', label: 'Account Holder Name', placeholder: 'Full legal name' },
                    { key: 'account_number', label: 'Account Number', placeholder: '1234567890' },
                    { key: 'bank_name', label: 'Bank Name', placeholder: 'SBI / HDFC / ICICI...' },
                    { key: 'ifsc_code', label: 'IFSC Code', placeholder: 'SBIN0001234' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{f.label}</label>
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        value={bankDetails[f.key]}
                        onChange={e => setBankDetails({ ...bankDetails, [f.key]: e.target.value })}
                        style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full justify-center"
                style={{ fontSize: 13, padding: '12px 20px' }}
              >
                {loading ? 'Processing...' : 'Submit Withdrawal Request'}
              </button>
            </>
          )}
        </form>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }} className="anim-fade-in">
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={28} className="text-[#4ade80]" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
            Request Submitted!
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8, fontWeight: '600' }}>
            Your withdrawal of <strong style={{ color: 'var(--text-primary)' }}>{parseInt(amount, 10).toLocaleString()} Sparks</strong> has been submitted. Your Creator balance has been deducted and will be paid once the admin processes it.
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 24, fontWeight: '600' }}>
            You'll receive a notification once it's processed (usually within 24 hours).
          </p>
          <Link href="/wallet" className="btn btn-primary w-full justify-center" style={{ fontSize: 13 }}>
            Go to Wallet
          </Link>
        </div>
      )}
    </div>
  );
}
