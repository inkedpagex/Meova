'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
    ifsc_code: '',
  });
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'success'

  useEffect(() => {
    // Get current wallet details to verify balance
    fetch('/api/wallet/create') // Note: Let's fetch wallet details
      .then(res => res.json())
      .then(data => {
        if (data.wallet) {
          setWallet(data.wallet);
        }
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt < 1000) {
      alert('Minimum withdrawal is 1,000 Sparks.');
      return;
    }

    if (wallet && wallet.creator < amt) {
      alert('Insufficient Creator Earnings balance.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          method,
          upi_id: method === 'upi' ? upiId : null,
          bank_details: method === 'bank' ? bankDetails : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep('success');
      } else {
        alert(data.error || 'Failed to submit request.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
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
              Cash out your Creator Earnings (ES) to UPI. Current Balance: <strong style={{ color: '#22c55e' }}>{creatorBalance.toLocaleString()} ES ⚡</strong>
            </p>
          </div>

          {creatorBalance < 1000 ? (
            <div className="bg-[var(--bg-elevated)] border border-red-500/20 p-5 rounded-2xl mb-6 shadow-sm">
              <p style={{ fontSize: 13, color: '#f87171', fontWeight: 800 }}>
                ⚠️ You need at least 1,000 Creator Sparks to withdraw.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: '600' }}>
                Keep hosting premium workshops, coffee sessions, and gigs to accumulate more earnings!
              </p>
            </div>
          ) : (
            <>
              {/* Amount input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Amount to Withdraw (Sparks)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1000"
                    max={creatorBalance}
                    placeholder="1000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    style={{
                      width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: 12, padding: '12px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                    }}
                  />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 800, color: 'var(--text-muted)' }}>
                    ES ⚡
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontWeight: '700' }}>
                  1 Spark = ₹1. Split conversion rate applies. Minimum: 1,000.
                </p>
              </div>

              {/* Select Method */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Method
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('upi')}
                    className={`flex-1 py-3 rounded-xl text-center border font-black text-xs transition-all active:scale-95 cursor-pointer ${
                      method === 'upi'
                        ? 'border-[var(--accent)] bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-mid)]'
                    }`}
                  >
                    UPI Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('bank')}
                    className={`flex-1 py-3 rounded-xl text-center border font-black text-xs transition-all active:scale-95 cursor-pointer ${
                      method === 'bank'
                        ? 'border-[var(--accent)] bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-mid)]'
                    }`}
                  >
                    Bank Account
                  </button>
                </div>
              </div>

              {/* Method Details */}
              {method === 'upi' ? (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    UPI ID
                  </label>
                  <input
                    type="text"
                    placeholder="username@upi"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    required={method === 'upi'}
                    style={{
                      width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: 12, padding: '12px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                    }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Account Holder Name</label>
                    <input
                      type="text"
                      required={method === 'bank'}
                      value={bankDetails.account_name}
                      onChange={e => setBankDetails({ ...bankDetails, account_name: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Account Number</label>
                    <input
                      type="text"
                      required={method === 'bank'}
                      value={bankDetails.account_number}
                      onChange={e => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Bank Name</label>
                      <input
                        type="text"
                        required={method === 'bank'}
                        value={bankDetails.bank_name}
                        onChange={e => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                        style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>IFSC Code</label>
                      <input
                        type="text"
                        required={method === 'bank'}
                        value={bankDetails.ifsc_code}
                        onChange={e => setBankDetails({ ...bankDetails, ifsc_code: e.target.value })}
                        style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full justify-center"
                style={{ fontSize: 13, padding: '12px 20px' }}>
                {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
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
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24, fontWeight: '600' }}>
            Your withdrawal request of <strong style={{ color: 'var(--text-primary)' }}>{parseInt(amount, 10).toLocaleString()} Sparks</strong> has been sent to the administration team for processing.
          </p>
          <div style={{ display: 'flex', gap: 3 }}>
            <Link href="/wallet" className="btn btn-primary flex-1 justify-center" style={{ fontSize: 13 }}>
              Go to Wallet
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
