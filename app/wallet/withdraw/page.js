'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, Clock, AlertCircle, Zap, ShieldCheck,
  Building2, Smartphone, Check, Loader2, Info
} from '@/lib/icons';
import { toast } from '@/lib/toast';

export default function WithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi'); // 'upi' | 'bank'
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
    ifsc_code: '',
  });

  const [wallet, setWallet] = useState(null);
  const [withdrawable, setWithdrawable] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet/withdraw');
      if (res.ok) {
        const data = await res.json();
        if (data.wallet) setWallet(data.wallet);
        setWithdrawable(data.withdrawable ?? data.earned ?? data.wallet?.creator ?? 0);
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {
      console.error('Error loading withdrawal data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const amt = parseInt(amount, 10);

    if (isNaN(amt) || amt < 500) {
      setError('Minimum withdrawal is 500 Sparks (₹500).');
      return;
    }
    if (amt > 25000) {
      setError('Maximum withdrawal per request is 25,000 Sparks (₹25,000).');
      return;
    }
    if (amt > withdrawable) {
      setError(`Insufficient Earned Balance. You have ${withdrawable} withdrawable Sparks (Recharged/Purchased Sparks cannot be withdrawn).`);
      return;
    }
    if (pendingCount >= 2) {
      setError('You have 2 pending withdrawals under review. Please wait for them to be processed.');
      return;
    }

    if (method === 'upi') {
      const cleanUpi = upiId.trim();
      const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!cleanUpi || !UPI_REGEX.test(cleanUpi)) {
        setError('Please enter a valid UPI ID (e.g. username@okhdfcbank)');
        return;
      }
    }

    if (method === 'bank') {
      if (!bankDetails.account_name?.trim() || !bankDetails.account_number?.trim() || !bankDetails.ifsc_code?.trim()) {
        setError('Please enter all required bank account details.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          method,
          upi_id: method === 'upi' ? upiId.trim() : null,
          bank_details: method === 'bank' ? bankDetails : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit withdrawal request.');
        setSubmitting(false);
        return;
      }

      toast.success('Withdrawal request submitted successfully!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wallet-updated'));
      }
      setStep('success');
      loadData();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen px-4 pt-[68px] md:pt-6 max-w-[500px] mx-auto pb-24 anim-fade-in relative text-[#1C1917]">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/wallet"
            className="p-2 rounded-xl bg-white border border-[#E7E5E4] text-[#1C1917] hover:bg-[#FAFAF8] cursor-pointer transition-all active:scale-95 shadow-2xs"
            title="Back to Wallet"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-[#1C1917]">Withdraw Earnings</h1>
            <p className="text-[11px] text-[#78716C] font-semibold">1 Spark = ₹1 Direct Payout</p>
          </div>
        </div>
      </div>

      {step === 'form' && (
        <>
          {/* Hero Withdrawable Balance Card */}
          <div className="rounded-[24px] p-6 mb-6 bg-white border border-[#E7E5E4] shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#78716C]">Withdrawable Balance</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check size={10} strokeWidth={3} />
                <span>Earned Funds</span>
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-4xl font-bold text-emerald-600 tracking-tight">
                {loading ? '...' : withdrawable.toLocaleString()}
              </span>
              <Zap size={24} className="text-emerald-500 fill-emerald-500" />
            </div>

            <p className="text-xs text-[#78716C] font-medium mt-3 leading-relaxed">
              Only Sparks earned through hosted meetings, workshops, coffee sessions, and rewards can be cashed out. Recharged Sparks are non-withdrawable.
            </p>
          </div>

          {/* Pending Request Banner */}
          {pendingCount >= 2 && (
            <div className="p-4 rounded-[20px] bg-amber-50 border border-amber-200 mb-6 flex items-start gap-3 shadow-2xs">
              <Clock size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">Pending Request Limit Reached</p>
                <p className="text-[11px] text-amber-700 mt-0.5 font-medium leading-relaxed">
                  You already have 2 pending withdrawal requests undergoing admin review. Please wait for them to be processed before submitting another request.
                </p>
              </div>
            </div>
          )}

          {/* Insufficient Balance Notice */}
          {withdrawable < 500 && !loading ? (
            <div className="p-5 rounded-[24px] bg-white border border-[#E7E5E4] mb-6 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-tint-10)] text-[var(--accent)] flex items-center justify-center mx-auto">
                <Zap size={22} className="fill-[var(--accent)]" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1917]">Minimum ₹500 Required to Withdraw</h3>
              <p className="text-xs text-[#78716C] font-medium leading-relaxed max-w-[340px] mx-auto">
                Accumulate at least 500 Creator Sparks by hosting 1:1 coffee sessions, running study workshops, or earning rewards to initiate a payout.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
              >
                Explore Creator Opportunities
              </Link>
            </div>
          ) : (
            pendingCount < 2 && (
              <form noValidate onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3.5 rounded-[16px] bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-rose-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-rose-700 leading-snug">{error}</p>
                  </div>
                )}

                {/* Amount Input */}
                <div className="bg-white p-5 rounded-[24px] border border-[#E7E5E4] shadow-xs space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#78716C] block">
                    Withdrawal Amount (Min ₹500)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="500"
                      min="500"
                      max={Math.min(25000, withdrawable)}
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      required
                      className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-xl px-4 py-3 text-base font-bold text-[#1C1917] outline-none focus:border-[var(--accent)] transition-all"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-[#78716C]">
                      <span>Sparks (₹)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#78716C]">
                    <span>Rate: 1 Spark = ₹1.00</span>
                    <button
                      type="button"
                      onClick={() => setAmount(String(withdrawable))}
                      className="text-[var(--accent)] font-bold hover:underline cursor-pointer"
                    >
                      Max ({withdrawable})
                    </button>
                  </div>
                </div>

                {/* Method Selector */}
                <div className="bg-white p-5 rounded-[24px] border border-[#E7E5E4] shadow-xs space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#78716C] block">
                    Payout Destination
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMethod('upi')}
                      className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        method === 'upi'
                          ? 'border-[var(--accent)] bg-[var(--accent-tint-10)] text-[var(--accent)] font-bold shadow-2xs'
                          : 'border-[#E7E5E4] bg-white text-[#1C1917] font-semibold hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <Smartphone size={16} />
                      <span className="text-xs">UPI Transfer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('bank')}
                      className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        method === 'bank'
                          ? 'border-[var(--accent)] bg-[var(--accent-tint-10)] text-[var(--accent)] font-bold shadow-2xs'
                          : 'border-[#E7E5E4] bg-white text-[#1C1917] font-semibold hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <Building2 size={16} />
                      <span className="text-xs">Bank Account</span>
                    </button>
                  </div>

                  {method === 'upi' ? (
                    <div className="pt-2 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                        Your UPI ID
                      </label>
                      <input
                        type="text"
                        placeholder="yourname@okaxis"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        required
                        className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-xl px-4 py-3 text-xs font-bold text-[#1C1917] outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  ) : (
                    <div className="pt-2 space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block mb-1">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          placeholder="Full Legal Name"
                          value={bankDetails.account_name}
                          onChange={e => setBankDetails({ ...bankDetails, account_name: e.target.value })}
                          className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1C1917] outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block mb-1">
                            Account Number
                          </label>
                          <input
                            type="text"
                            placeholder="1234567890"
                            value={bankDetails.account_number}
                            onChange={e => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                            className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1C1917] outline-none focus:border-[var(--accent)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block mb-1">
                            IFSC Code
                          </label>
                          <input
                            type="text"
                            placeholder="SBIN0001234"
                            value={bankDetails.ifsc_code}
                            onChange={e => setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })}
                            className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs font-semibold uppercase text-[#1C1917] outline-none focus:border-[var(--accent)]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          placeholder="State Bank of India / HDFC"
                          value={bankDetails.bank_name}
                          onChange={e => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                          className="w-full bg-[#FAFAF8] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1C1917] outline-none focus:border-[var(--accent)]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting || withdrawable < 500}
                  className="w-full py-4 rounded-full text-white font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <span>Request Payout of ₹{amount || '0'}</span>
                  )}
                </button>
              </form>
            )
          )}

          {/* Withdrawal History Section */}
          <div className="mt-8 space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#78716C]">
              Withdrawal History ({withdrawals.length})
            </h2>

            {withdrawals.length === 0 ? (
              <div className="p-6 rounded-[20px] bg-white border border-[#E7E5E4] text-center shadow-2xs">
                <p className="text-xs font-semibold text-[#78716C]">No past withdrawal requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {withdrawals.map(wd => {
                  const isPaid = wd.status === 'paid' || wd.status === 'approved';
                  const isRejected = wd.status === 'rejected';
                  const isPending = wd.status === 'pending';
                  const amt = Number(wd.amount || wd.sparks || wd.rupees || 0);

                  return (
                    <div key={wd.id} className="p-4 rounded-[18px] bg-white border border-[#E7E5E4] shadow-2xs flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#1C1917]">
                            ₹{amt.toLocaleString()}
                          </p>
                          <span className="text-[10px] text-[#78716C] font-semibold">
                            via {wd.method === 'bank' ? 'Bank' : 'UPI'}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#78716C] font-medium mt-0.5 truncate">
                          {wd.remarks || (wd.method === 'bank' ? 'Bank Transfer' : wd.upi_id)}
                        </p>
                        <p className="text-[9px] text-[#78716C] mt-0.5 font-semibold">
                          {new Date(wd.requested_at || wd.created_at || Date.now()).toLocaleDateString('en-IN', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 flex-shrink-0 ${
                        isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isRejected ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {isPaid && <Check size={10} strokeWidth={3} />}
                        {isPending && <Clock size={10} />}
                        {isRejected && <AlertCircle size={10} />}
                        <span>{wd.status}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {step === 'success' && (
        <div className="p-8 rounded-[32px] bg-white border border-[#E7E5E4] shadow-sm text-center space-y-4 anim-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-lg font-bold text-[#1C1917]">Payout Request Submitted!</h2>
          <p className="text-xs text-[#78716C] font-medium leading-relaxed max-w-[340px] mx-auto">
            Your request for <strong className="text-[#1C1917]">₹{parseInt(amount, 10).toLocaleString()}</strong> has been submitted. Funds have been held in your ledger and will be paid to your {method === 'upi' ? `UPI (${upiId})` : 'bank account'} once verified.
          </p>
          <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E7E5E4] text-xs font-semibold text-[#78716C]">
            Processing time: Usually within 24 hours
          </div>
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => {
                setStep('form');
                setAmount('');
              }}
              className="flex-1 py-3 rounded-full text-xs font-bold text-[#78716C] bg-white border border-[#E7E5E4] hover:bg-[#FAFAF8] transition-all cursor-pointer"
            >
              View History
            </button>
            <Link
              href="/wallet"
              className="flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all flex items-center justify-center shadow-xs"
            >
              Done
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

