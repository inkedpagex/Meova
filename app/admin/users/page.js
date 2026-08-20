'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Shield, User, Star, MapPin } from 'lucide-react';

const ROLES = [
  { value: 'user', label: 'Student (Normal)' },
  { value: 'verified_host', label: 'Verified Host' },
  { value: 'campus_lead', label: 'Campus Lead' },
  { value: 'admin', label: 'Administrator' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/list-users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  async function handleRoleChange(uid, newRole) {
    setUpdatingId(uid);
    try {
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid: uid, role: newRole }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === uid ? { ...u, role: newRole } : u));
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update role');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>User Management</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Search users and assign permissions (Verified Host, Campus Lead, Admin).
        </p>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 12, padding: '12px 14px 12px 40px', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading users...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No users found matching search criteria.
            </div>
          ) : (
            filtered.map(u => (
              <div key={u.id} className="card flex items-center justify-between gap-4 p-4"
                style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {u.role === 'admin' ? '🛡️' : u.role === 'verified_host' ? '🌟' : '🎓'}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                      {u.full_name || 'Anonymous Student'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {u.email} {u.year ? `· Year ${u.year}` : ''} {u.branch ? `· ${u.branch}` : ''}
                    </p>
                  </div>
                </div>

                {/* Role Switcher */}
                <div className="flex items-center gap-2">
                  <select
                    value={u.role || 'user'}
                    disabled={updatingId === u.id}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    style={{
                      background: 'var(--bg-overlay)', color: 'white', border: '1px solid var(--border-subtle)',
                      borderRadius: 8, padding: '6px 10px', fontSize: 12, outline: 'none', cursor: 'pointer',
                    }}>
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value} style={{ background: '#0a0a0a' }}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
