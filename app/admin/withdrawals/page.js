'use client';
import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Search, DollarSign, CreditCard } from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/list-withdrawals');
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  async function handleWithdrawal(id, action) {
    setActionLoading(id);
    const originalWithdrawals = [...withdrawals];

    // Optimistically update
    setWithdrawals(prev =>
      prev.map(w => w.id === id ? { ...w, status: action === 'approve' ? 'approved' : 'rejected' } : w)
    );

    try {
      const res = await fetch('/api/admin/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: id,
          action,
          remarks: remarks[id] || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Withdrawal successfully ${action}d!`);
        fetchWithdrawals();
      } else {
        alert(data.error || 'Failed to update withdrawal');
        setWithdrawals(originalWithdrawals); // Rollback
      }
    } catch (e) {
      alert('Network error');
      setWithdrawals(originalWithdrawals); // Rollback
    } finally {
      setActionLoading(null);
    }
  }

  const pending = withdrawals.filter(w => w.status === 'pending');
  const completed = withdrawals.filter(w => w.status !== 'pending');

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Withdrawal Requests</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Review and approve Creator Earnings withdrawal requests. Payments must be processed manually to the user&apos;s details shown below.
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading withdrawals...</p>
      ) : (
        <>
          {/* Pending Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
              Pending Approvals ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                No pending withdrawals 🎉
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pending.map(w => (
                  <div key={w.id} className="card"
                    style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border-subtle)' }}>
                    <div className="flex justify-between items-start gap-4 flex-wrap" style={{ marginBottom: 16 }}>
                      <div>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#4ade80' }}>
                          {w.amount.toLocaleString()} ⚡
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Requested by: <strong style={{ color: 'var(--text-primary)' }}>{w.email}</strong>
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Date: {new Date(w.requested_at).toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Payment Destination Details */}
                      <div className="glass" style={{ padding: '10px 14px', borderRadius: 10, minWidth: 200 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                          Payment Details ({w.method})
                        </p>
                        {w.method === 'upi' ? (
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                            {w.upi_id}
                          </p>
                        ) : (
                          <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                            <p>Bank: {w.bank_details?.bank_name}</p>
                            <p>A/C: {w.bank_details?.account_number}</p>
                            <p>IFSC: {w.bank_details?.ifsc_code}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Block */}
                    <div className="flex gap-3 flex-wrap items-center">
                      <input
                        placeholder="Remarks / transaction reference ID (optional)"
                        value={remarks[w.id] || ''}
                        onChange={e => setRemarks({ ...remarks, [w.id]: e.target.value })}
                        style={{
                          flex: 1, minWidth: 200, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
                          borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'white', outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => handleWithdrawal(w.id, 'approve')}
                        disabled={actionLoading !== null}
                        className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px' }}>
                        Approve & Deduct
                      </button>
                      <button
                        onClick={() => handleWithdrawal(w.id, 'reject')}
                        disabled={actionLoading !== null}
                        className="btn btn-outline" style={{ fontSize: 12, padding: '8px 16px', color: '#f87171', borderColor: '#f8717140' }}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History Section */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
              Processed Requests ({completed.length})
            </h2>
            {completed.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                No past withdrawals recorded.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {completed.map(w => {
                  const isApp = w.status === 'approved' || w.status === 'paid';
                  return (
                    <div key={w.id} className="card flex justify-between items-center gap-4"
                      style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                          {w.amount.toLocaleString()} ⚡ — {w.email}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Method: {w.method?.toUpperCase()} · Remarks: {w.remarks || 'None'}
                        </p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isApp ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {isApp ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {w.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
