'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Zap, Clock } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetch('/api/admin/list-payments').then(r => r.json()).then(d => setPayments(d.payments || []));
  }, [result]);

  async function handle(action) {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceCode: code.trim(), action }),
      });
      const data = await res.json();
      setResult({ ok: data.ok, message: data.message || data.error });
      if (data.ok) setCode('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Payment Verification</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Verify QR payments by entering the reference code sent with the UPI transfer.
        </p>
      </div>

      {/* Code input */}
      <div className="glass" style={{ borderRadius: 18, padding: 24, marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Enter Reference Code
        </p>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1" style={{ position: 'relative', minWidth: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="SPK-XXXX-POPULAR-..."
              style={{
                width: '100%', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
                borderRadius: 12, padding: '12px 14px 12px 40px', color: 'var(--text-primary)',
                fontSize: 13, fontFamily: 'monospace', fontWeight: 600, outline: 'none',
              }}
              onKeyDown={e => e.key === 'Enter' && handle('approve')}
            />
          </div>
          <button onClick={() => handle('approve')} disabled={!code || loading}
            className="btn btn-primary flex items-center gap-2" style={{ fontSize: 13 }}>
            <CheckCircle size={14} /> Approve
          </button>
          <button onClick={() => handle('reject')} disabled={!code || loading}
            className="btn btn-outline flex items-center gap-2" style={{ fontSize: 13, color: '#f87171', borderColor: '#f8717140' }}>
            <XCircle size={14} /> Reject
          </button>
        </div>

        {result && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: result.ok ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${result.ok ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: result.ok ? '#4ade80' : '#f87171' }}>
              {result.ok ? '✅' : '❌'} {result.message}
            </p>
          </div>
        )}
      </div>

      {/* Pending payments list */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Pending Payments</h2>
        {payments.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            No pending payments 🎉
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {payments.map(p => (
              <div key={p.id} className="card flex items-center gap-4"
                style={{ background: 'var(--bg-surface)', borderRadius: 14, padding: '14px 18px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ flexShrink: 0 }}>
                  <Clock size={16} style={{ color: '#fb923c' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.pack_name} Pack — {p.sparks} ⚡
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {p.email} · ₹{p.amount_inr}
                  </p>
                  <code style={{ fontSize: 11, color: '#fb923c', letterSpacing: '0.04em', marginTop: 4, display: 'block' }}>
                    {p.reference_code}
                  </code>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setCode(p.reference_code); handle('approve'); }}
                    className="btn btn-ghost" style={{ fontSize: 11, padding: '6px 12px', color: '#4ade80', borderColor: '#4ade8030' }}>
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
